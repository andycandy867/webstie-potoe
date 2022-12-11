import re
from flask import render_template, url_for, flash, redirect, request, Blueprint, make_response, jsonify
from flask_login import login_user, current_user, logout_user
from flaskblog import db, bcrypt
from flaskblog.models import User, Post, Collection
from flaskblog.users.forms import RegistrationForm, SignInForm, RequestResetForm, UpdateDescriptionForm

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

		read_later = Collection(user_id=current_user.id, name="Read Later", type='RL')
		db.session.add(read_later)

		archived = Collection(user_id=current_user.id, name='Archived', type='archived')
		db.session.add(archived)

		db.session.commit()
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

	user_collections = Collection.query.filter_by(user_id=user.id, type=None).all()

	return render_template('user_collections.html', title=username, user=user, user_followed=user_followed,
	user_collections=user_collections)


@users.route('/user/<string:username>/about', methods=["GET", "POST"])
def user_about(username):
	form = None
	user = User.query.filter_by(username=username).first_or_404()

	if request.method == "GET":
		user_followed = False
		if current_user.is_authenticated:
			form = UpdateDescriptionForm()
			if user in current_user.following:
				user_followed = True

		user_date_joined = user.date_joined.strftime("%b %d %Y")

		user_total_views = 0
		for post in user.posts:
			user_total_views += post.views

		return render_template('user_about.html', title=username, user=user, user_followed=user_followed,
							   user_date_joined=user_date_joined, user_total_views=user_total_views, form=form)
	elif request.method == "POST":
		form = UpdateDescriptionForm()

		if form.validate_on_submit():
			if current_user == user:
				current_user.description = form.description.data
				db.session.commit()

		return redirect(url_for("users.user_about", username=user.username))


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


@users.route('/reset_password_request', methods=["GET", "POST"])
def reset_password_request():
	if current_user.is_authenticated:
		return redirect(url_for('main.home'))

	form = RequestResetForm()
	if form.validate_on_submit():
		user = User.query.filter_by(email=form.email.data).first()
		if user:
			if form.question.data == user.security_question and form.answer.data == user.security_question_answer:
				login_user(user, remember=True)
				flash('Successfully Logged in. Please Change your password', 'success')
				return redirect(url_for('settings.reset_password'))
			else:
				flash('The Security Question and Answer do not match up', 'danger')
		else:
			flash(f'A user with the email of "{form.email.data}" does not exist.', 'danger')
		return redirect(url_for('users.signin'))
	return render_template('reset_request.html', title='Reset Password', form=form)
