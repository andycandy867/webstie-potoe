import re
from flask import render_template, url_for, flash, redirect, request, Blueprint, make_response, jsonify
from flask_login import login_user, current_user, logout_user
from flaskblog import db, bcrypt
from flaskblog.models import User, Post
from flaskblog.users.forms import RegistrationForm, SignInForm, RequestResetForm, ResetPasswordForm
from flaskblog.users.utils import send_reset_email

users = Blueprint('users', __name__)


@users.route('/signup', methods=["GET", "POST"])
def register():
	if current_user.is_authenticated:
		return redirect(url_for('main.home'))

	form = RegistrationForm()
	if form.validate_on_submit():
		hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
		user = User()
		user.username = form.username.data
		user.email = form.email.data
		user.password = hashed_password
		db.session.add(user)
		db.session.commit()
		flash('Account Successfully Created', category='success')
		login_user(user, remember=True)
		return redirect(url_for('main.home'))

	return render_template('register.html', title='Sign Up', form=form)


@users.route('/signin', methods=["GET", "POST"])
def signin():
	if current_user.is_authenticated:
		return redirect(url_for('main.home'))

	form = SignInForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first() or User.query.filter_by(username=form.email.data).first()
		if user and bcrypt.check_password_hash(user.password, form.password.data):
			login_user(user, remember=form.remember.data)
			next_page = request.args.get('next')
			return redirect(next_page) if next_page else redirect(url_for('main.home'))
		else:
			flash('Invalid Credentials', category='danger')

	return render_template('signin.html', title='Sign In', form=form)


@users.route("/logout")
def logout():
	logout_user()
	return redirect(url_for('main.home'))


@users.route('/user/<string:username>')
def user_page(username):
	user = User.query.filter_by(username=username).first_or_404()
	most_viewed_user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.views.desc()).limit(5).all()
	most_recent_user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_posted.desc()).limit(5).all()
	featured_post = Post.query.get(user.featured_post_id)

	posts = most_viewed_user_posts + most_recent_user_posts

	if featured_post:
		posts += featured_post

	limit_content = {}
	for post in posts:
		splinted = re.split('{{|}}', post.content)

		for i, splint in enumerate(splinted):
			if splint == '':
				splinted.pop(i)
			elif '*/#|>' in splint:
				splinted.pop(i)

		if len(splinted[0].split()) > 17:
			limit_content[post.id] = splinted[0].split('\n')[0]
		else:
			limit_content[post.id] = splinted[0] + '...'

	user_followed = False
	if current_user.is_authenticated:
		if user in current_user.following:
			user_followed = True

	return render_template('user_page.html', title=username, user=user, user_followed=user_followed,
						   featured_post=featured_post, most_viewed_user_posts=most_viewed_user_posts,
						   most_recent_user_posts=most_recent_user_posts, limit_content=limit_content)


@users.route('/user/<string:username>/posts')
def user_posts(username):
	user = User.query.filter_by(username=username).first_or_404()
	all_user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_posted.desc()).all()
	posts_count = len(all_user_posts)

	limit_content = {}
	for post in all_user_posts:
		splinted = re.split('{{|}}', post.content)

		for i, splint in enumerate(splinted):
			if splint == '':
				splinted.pop(i)
			elif '*/#|>' in splint:
				splinted.pop(i)

		if len(splinted[0].split()) > 17:
			limit_content[post.id] = splinted[0].split('\n')[0]
		else:
			limit_content[post.id] = splinted[0] + '...'

	user_followed = False
	if current_user.is_authenticated:
		if user in current_user.following:
			user_followed = True

	return render_template('user_posts.html', title=username, user=user, user_followed=user_followed,
						   posts_count=posts_count, all_user_posts=all_user_posts, limit_content=limit_content)


@users.route('/user/<string:username>/collections')
def user_collections(username):
	user = User.query.filter_by(username=username).first_or_404()

	user_followed = False
	if current_user.is_authenticated:
		if user in current_user.following:
			user_followed = True

	return render_template('user_collections.html', title=username, user=user, user_followed=user_followed)


@users.route('/user/<string:username>/about')
def user_about(username):
	user = User.query.filter_by(username=username).first_or_404()

	user_followed = False
	if current_user.is_authenticated:
		if user in current_user.following:
			user_followed = True

	return render_template('user_about.html', title=username, user=user, user_followed=user_followed)


@users.route('/user/follow', methods=["POST"])
def follow():
	post_id = request.json.get('post_id')
	user_id = request.json.get('user_id')

	if post_id:
		post = Post.query.get_or_404(post_id)
		user = post.author
	elif user_id:
		user = User.query.get(user_id)

	if user:
		if current_user != user:
			if user not in current_user.following:
				current_user.follow(user)
				following_status = True
			elif user in current_user.following:
				current_user.unfollow(user)
				following_status = False

			db.session.commit()
			return make_response(jsonify({'status': 'success', 'following_status': following_status}))
	else:
		return make_response(jsonify({'status': 'failure'}))


@users.route('/reset_password', methods=["GET", "POST"])
def reset_request():
	if current_user.is_authenticated:
		return redirect(url_for('main.home'))
	form = RequestResetForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first()
		if user:
			send_reset_email(user)
		flash(f'An email has been sent to "{form.email.data}" with instructions to reset your password.', 'info')
		return redirect(url_for('users.signin'))
	return render_template('reset_request.html', title='Reset Password', form=form)


@users.route('/reset_password/<token>', methods=["GET", "POST"])
def reset_token(token):
	if current_user.is_authenticated:
		return redirect(url_for('main.home'))
	user = User.verify_reset_token(token)
	if not user:
		flash('Invalid or expired token', 'warning')
		return redirect(url_for('users.reset_request'))
	form = ResetPasswordForm()
	if form.validate_on_submit():
		hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
		user.password = hashed_password
		db.session.commit()
		flash('Your password has been updated.', category='success')
		return redirect(url_for('users.signin'))

	return render_template('reset_token.html', title='Reset Password', form=form)
