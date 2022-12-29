import re
from flask import render_template, url_for, flash, redirect, request, Blueprint, make_response, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from flaskblog import db, bcrypt
from flaskblog.models import User, Post, Collection
from flaskblog.users.forms import RegistrationForm, SignInForm, RequestResetForm, UpdateBannerImageForm,\
	UpdateDescriptionForm
from flaskblog.users.utils import allowed_file, save_file, delete_previous_file

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
	update_banner_image_form = UpdateBannerImageForm()
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

	return render_template('/user_pages/user_page.html', title=username, user=user, featured_post=featured_post,
						   most_viewed_user_posts=most_viewed_user_posts, most_recent_user_posts=most_recent_user_posts,
						   limit_content=limit_content, update_banner_image_form=update_banner_image_form)


@users.route('/user/<string:username>/posts')
def user_posts(username):
	user = User.query.filter_by(username=username).first_or_404()
	update_banner_image_form = UpdateBannerImageForm()
	all_user_posts = Post.query.filter_by(user_id=user.id).order_by(Post.date_posted.desc()).all()

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

	return render_template('/user_pages/user_posts.html', title=username, user=user,
						   update_banner_image_form=update_banner_image_form, all_user_posts=all_user_posts,
						   limit_content=limit_content)


@users.route('/user/<string:username>/collections')
def user_collections(username):
	user = User.query.filter_by(username=username).first_or_404()
	update_banner_image_form = UpdateBannerImageForm()
	user_collections = Collection.query.filter_by(user_id=user.id, type=None).all()

	return render_template('/user_pages/user_collections.html', title=username, user=user,
						   update_banner_image_form=update_banner_image_form, user_collections=user_collections)


@users.route('/user/<string:username>/about', methods=["GET", "POST"])
def user_about(username):
	user = User.query.filter_by(username=username).first_or_404()
	update_banner_image_form = UpdateBannerImageForm()

	if request.method == "GET":
		form = None
		if current_user.is_authenticated:
			form = UpdateDescriptionForm()

		user_date_joined = user.date_joined.strftime("%b %d %Y")

		user_total_views = 0
		for post in user.posts:
			user_total_views += post.views

		return render_template('/user_pages/user_about.html', title=username, user=user,
							   update_banner_image_form=update_banner_image_form, user_date_joined=user_date_joined,
							   user_total_views=user_total_views, form=form)
	elif request.method == "POST":
		form = UpdateDescriptionForm()

		if form.validate_on_submit():
			if current_user == user:
				current_user.description = form.description.data
				db.session.commit()

		return redirect(url_for("users.user_about", username=user.username))


@users.route("/user/<string:username>/edit", methods=["POST"])
@login_required
def user_edit(username):
	user = User.query.filter_by(username=username).first_or_404()
	action = request.args.get("action", str)

	if current_user == user:
		if action == "change_banner_img":
			update_banner_image_form = UpdateBannerImageForm()

			if update_banner_image_form.validate_on_submit():
				if update_banner_image_form.image_file.data:

					if 'image_file' not in request.files:
						flash('No file part')

					blob = request.files['image_file'].read()
					size = len(blob)
					if size > 1024 * 1024 * 5:
						flash('Uploads must be under 5 Megabytes', 'danger')
						return redirect(url_for('users.user_page', username=user.username))

					file = update_banner_image_form.image_file.data

					if file.filename == '':
						flash('No selected file')
					if file and allowed_file(file.filename):
						if user.banner_image != "default_banner.jpg":
							delete_previous_file(user.banner_image)
						uploaded_file_path = save_file(file, user.id)

						user.banner_image = uploaded_file_path
						db.session.commit()

		return redirect(url_for('users.user_page', username=user.username))


@users.route('/user/<string:username>/follow', methods=["POST"])
@login_required
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
@login_required
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
