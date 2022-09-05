import re
from flask import render_template, url_for, flash, redirect, request, abort, Blueprint
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import Post, PostCache, Media, Comment
from flaskblog.posts.forms import PostForm, CommentForm, LikeForm, DislikeForm, FollowForm
from flaskblog.posts.utils import save_file, allowed_file


posts = Blueprint('posts', __name__)
MEDIA_CODE = '*/#|>'


@posts.route("/post/new", methods=["GET", "POST"])
@login_required
def new_post():
	post_form = PostForm()

	post_cache_id = request.args.get('post_cache_id', None)

	if post_cache_id:
		post_cache = PostCache.query.filter_by(id=post_cache_id, user_id=current_user.id).first()

		if not post_cache:
			abort(404)
	else:
		post_cache = PostCache(user_id=current_user.id, title="Post Title", content="Post Content")
		db.session.add(post_cache)
		db.session.commit()
		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))

	post_caches = PostCache.query.filter_by(user_id=current_user.id).order_by(PostCache.date_cached.desc()).all()
	uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())

	if request.method == "GET":
		splinted = re.split('{{|}}', post_cache.content)

		for i, splint in enumerate(splinted):
			if splint == '':
				splinted.pop(i)

		post_form.title.data = post_cache.title

		return render_template('create_post.html', title='New Post', post_form=post_form, post_cache=post_cache,
							   uploaded_media=uploaded_media, post_caches=post_caches, splinted=splinted)
	elif request.method == "POST":
		unsorted_items = []
		for item in request.form:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.form.get(str(item))

		post_cache.title = post_form.title.data
		post_cache.content = ""
		for item_id in items:
			print(item_id, items[item_id])
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				edited_item_name = f'{{{{{found_media.file}{MEDIA_CODE}}}}}'
				post_cache.content += edited_item_name
			else:
				print('no media so add pls')
				post_cache.content += items[item_id]
				print(post_cache.content)

		if post_form.import_file.data:
			if 'file' not in request.files:
				flash('No file part')

			file = post_form.import_file.data

			if file.filename == '':
				flash('No selected file')
			if file and allowed_file(file.filename):
				uploaded_file_path = save_file(file)
				uploaded_file = Media(user_id=current_user.id, file=uploaded_file_path)

				edited_file_path = f'{{{{{uploaded_file_path}{MEDIA_CODE}}}}}'

				post_cache.content += edited_file_path + ' '
				print(post_cache.content)

				db.session.add(uploaded_file)
				db.session.commit()
				return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.file.data:
			print('file select')
			post_cache.content += f'{{{{{post_form.file.data}{MEDIA_CODE}}}}}' + ' '
			db.session.commit()
			return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.submit.data and post_form.validate():
			print('posted')
			created_post = Post(title=post_cache.title, content=post_cache.content, author=current_user)
			db.session.delete(post_cache)
			db.session.add(created_post)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=created_post.id))
		else:
			print('else')
			post_cache.title = post_form.title.data
			db.session.commit()

		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))


@posts.route("/post/<int:post_id>")
def post(post_id):
	post = Post.query.get_or_404(post_id)
	comments = Comment.query.filter_by(post_id=post_id)
	# order_by(Comment.likes.desc()) Once again, random or 'relevant'

	post_comment_form = CommentForm()
	comment_comment_form = CommentForm()

	post_like_form = LikeForm()
	post_dislike_form = DislikeForm()

	comment_like_form = LikeForm()
	comment_dislike_form = DislikeForm()

	follow_form = FollowForm()

	post_liked = 'undefined'
	author_followed = False
	if current_user.is_authenticated:
		# Post View
		if post in current_user.posts_viewed:
			current_user.posts_viewed.remove(post)

		current_user.posts_viewed.append(post)

		# Post Like
		if post in current_user.posts_liked:
			post_liked = 'True'
		elif post in current_user.posts_disliked:
			post_liked = False

		# Author Following
		if post.author in current_user.following:
			author_followed = True

	splinted = re.split('{{|}}', post.content)

	for i, splint in enumerate(splinted):
		if splint == '':
			splinted.pop(i)

	post.views += 1
	db.session.commit()

	return render_template('post.html', title=post.title, post=post, splinted=splinted, comments=comments,
						   post_comment_form=post_comment_form, post_like_form=post_like_form,
						   post_dislike_form=post_dislike_form, comment_comment_form=comment_comment_form,
						   comment_like_form=comment_like_form, comment_dislike_form=comment_dislike_form,
						   follow_form=follow_form, post_liked=post_liked, author_followed=author_followed)


@posts.route("/comment", methods=["POST"])
def comment():
	post_id = request.args.get('post_id')
	comment_id = request.args.get('comment_id')

	post = Post.query.get_or_404(post_id)
	post.views -= 1

	if comment_id == '0':
		post_comment_form = CommentForm()
		post_like_form = LikeForm()
		post_dislike_form = DislikeForm()

		# Commenting directly to post
		liked = 'undefined'
		if post in current_user.posts_liked:
			liked = 'True'
		elif post in current_user.posts_disliked:
			liked = False

		if post_like_form.like_submit.data and post_like_form.validate():
			if liked == 'True':
				current_user.posts_liked.remove(post)
			elif liked == 'undefined':
				current_user.posts_liked.append(post)
			elif not liked:
				current_user.posts_disliked.remove(post)
				current_user.posts_liked.append(post)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))
		elif post_dislike_form.dislike_submit.data and post_dislike_form.validate():
			if not liked:
				current_user.posts_disliked.remove(post)
			elif liked == 'undefined':
				current_user.posts_disliked.append(post)
			elif liked == 'True':
				current_user.posts_liked.remove(post)
				current_user.posts_disliked.append(post)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))

		if post_comment_form.validate_on_submit():
			created_comment = Comment(content=post_comment_form.content.data, author=current_user,
									  parent=Post.query.get(post_id))
			db.session.add(created_comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))
	else:
		comment_comment_form = CommentForm()
		comment_like_form = LikeForm()
		comment_dislike_form = DislikeForm()

		# Commenting under another comment
		comment = Comment.query.get_or_404(comment_id)

		liked = 'undefined'
		if comment in current_user.comments_liked:
			liked = 'True'
		elif comment in current_user.comments_disliked:
			liked = False

		if comment_like_form.like_submit.data and comment_like_form.validate():
			if liked == 'True':
				current_user.comments_liked.remove(comment)
			elif liked == 'undefined':
				current_user.comments_liked.append(comment)
			elif not liked:
				current_user.comments_disliked.remove(comment)
				current_user.comments_liked.append(comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))
		elif comment_dislike_form.dislike_submit.data and comment_dislike_form.validate():
			if not liked:
				current_user.comments_disliked.remove(comment)
			elif liked == 'undefined':
				current_user.comments_disliked.append(comment)
			elif liked == 'True':
				current_user.comments_liked.remove(comment)
				current_user.comments_disliked.append(comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))

		if comment_comment_form.validate_on_submit():
			Comment.query.get_or_404(comment_id)
			created_comment = Comment(content=comment_comment_form.content.data, author=current_user,
									  parent=Post.query.get(post_id), comment_id=comment_id)
			db.session.add(created_comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))


@posts.route("/post/<int:post_id>/update", methods=["GET", "POST"])
@login_required
def update_post(post_id):
	post = Post.query.get_or_404(post_id)
	if post.author != current_user:
		abort(403)
	form = PostForm()
	if form.validate_on_submit():
		post.title = form.title.data
		post.content = form.content.data
		db.session.commit()
		flash('Post Updated.', 'success')
		return redirect(url_for('posts.post', post_id=post.id))
	elif request.method == "GET":
		# Default Data
		form.title.data = post.title
		form.content.data = post.content
	return render_template('create_post.html', title='Update Post', form=form, legend='Update Post')


@posts.route("/post/<int:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id):
	post = Post.query.get_or_404(post_id)
	if post.author != current_user:
		abort(403)
	db.session.delete(post)
	db.session.commit()
	flash('Post Deleted.', 'success')
	return redirect(url_for('main.home'))
