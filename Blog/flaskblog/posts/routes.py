import re
from flask import render_template, url_for, flash, redirect, request, abort, Blueprint, make_response, jsonify
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import Post, PostCache, Media, Comment
from flaskblog.posts.forms import PostForm, CommentForm
from flaskblog.posts.utils import save_file, allowed_file
from wtforms.validators import ValidationError


posts = Blueprint('posts', __name__)

MEDIA_CODE = '*/#|>'
EMPTY_CODE = ':*EMPTY*:'

quantity = 15
comments = []


@posts.route("/post/caches", methods=["GET", "POST"])
@login_required
def post_caches():
	post_cachess = PostCache.query.filter_by(user_id=current_user.id).order_by(PostCache.date_cached.desc()).all()

	limit_content = {}
	for post_cache in post_cachess:
		print(post_cache.content)
		splinted_raw = re.split('{{|}}', post_cache.content)

		splinted = []
		for i, splint in enumerate(splinted_raw):
			if splint == '':
				pass
			elif '*/#|>' in splint:
				pass
			elif EMPTY_CODE in splint:
				pass
			else:
				splinted.append(splint)

		if len(splinted) >= 1:
			print(len(splinted[0].split()))
			if len(splinted[0].split()) < 17:
				limit_content[post_cache.id] = splinted[0].split('\n')[0]
			else:
				limit_content[post_cache.id] = splinted[0] + '...'
		else:
			limit_content[post_cache.id] = None


		# for i, splint in enumerate(splinted_raw):
		# 	if splint != '' and MEDIA_CODE not in splint and EMPTY_CODE not in splint:
		# 		splinted.append(splint)
#
		# if splinted:
		# 	if len(splinted[0].split()) > 17:
		# 		limit_content[post_cache.id] = splinted[0] + ' ...'
		# 	else:
		# 		limit_content[post_cache.id] = splinted[0].split('\n')[0]

	return render_template('post_caches.html', title='Post Caches', post_caches=post_cachess, limit_content=limit_content)


@posts.route('/post_cache/delete', methods=["POST"])
def delete_post_cache():
	post_cache_id = request.json['post_cache_id']
	post_cache = PostCache.query.filter_by(id=post_cache_id, user_id=current_user.id).first()
	if post_cache:
		db.session.delete(post_cache)
		db.session.commit()
		return make_response(jsonify('success'))
	else:
		return make_response(jsonify('failure'))


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
		post_cache = PostCache(user_id=current_user.id, title="", content=f'{{{{{EMPTY_CODE}}}}}')
		db.session.add(post_cache)
		db.session.commit()
		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))

	if request.method == "GET":
		if post_cache:
			splinted = re.split('{{|}}', post_cache.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i+1] == EMPTY_CODE:
							splinted.pop(i+1)

			post_form.title.data = post_cache.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('create_post.html', title='New Post', post_cache_id=post_cache.id,
								   post_form=post_form, uploaded_media=uploaded_media, splinted=splinted)
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
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = request.form.get(f'size-{item_id}')
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_cache.content += edited_item_name
			elif items[item_id] != '':
				post_cache.content += items[item_id]
			else:
				post_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		if post_form.import_file.data:
			if 'import_file' not in request.files:
				flash('No file part')

			blob = request.files['import_file'].read()
			size = len(blob)
			if size > 1024 * 1024 * 5:
				flash('Uploads must be under 5 Megabytes', 'danger')
				return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))

			file = post_form.import_file.data

			if file.filename == '':
				flash('No selected file')
			if file and allowed_file(file.filename):
				uploaded_file_path = save_file(file)
				uploaded_file = Media(user_id=current_user.id, file=uploaded_file_path)

				edited_file_path = f'{{{{{uploaded_file_path}|:50:|{MEDIA_CODE}}}}}'

				post_cache.content += edited_file_path + f'{{{{{EMPTY_CODE}}}}}'

				db.session.add(uploaded_file)
				db.session.commit()
				return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.file.data:
			post_cache.content += f'{{{{{post_form.file.data}|:50:|{MEDIA_CODE}}}}}' + f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.add_empty.data and post_form.validate():
			post_cache.content += f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))
		elif post_form.submit.data and post_form.validate():
			created_post = Post(title=post_cache.title, content=post_cache.content, author=current_user)
			db.session.delete(post_cache)
			db.session.add(created_post)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=created_post.id))
		else:
			post_cache.title = post_form.title.data
			db.session.commit()

		return redirect(url_for('posts.new_post', post_cache_id=post_cache.id))


@posts.route('/post/save', methods=['POST'])
def save_post():
	post_cache_id = request.args.get('post_cache_id')
	post_cache = PostCache.query.filter_by(id=post_cache_id, user_id=current_user.id).first()

	if post_cache:
		all_items = request.json
		post_cache.title = all_items['title']
		post_cache.content = ""

		unsorted_items = []
		for item in all_items:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.json[str(item)]

		for item_id in items:
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = all_items[f'size-{item_id}']
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_cache.content += edited_item_name
			elif items[item_id] != '':
				post_cache.content += items[item_id]
			else:
				post_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		db.session.commit()
		return make_response(jsonify('success'))
	else:
		return make_response(jsonify('failure'))


@posts.route("/post/delete_media", methods=['POST'])
def delete_media():
	media_id = request.json.get('media_id')

	found_media = Media.query.filter_by(user_id=current_user.id, id=media_id).first()

	if found_media:
		db.session.delete(found_media)
		db.session.commit()
		return make_response(jsonify('success'))
	else:
		return make_response(jsonify('failure'))


@posts.route("/post/<int:post_id>")
def post(post_id):
	post = Post.query.get_or_404(post_id)
	comments = Comment.query.filter_by(post_id=post_id)
	# order_by(Comment.likes.desc()) Once again, random or 'relevant'

	# global comments
	# comments = []
	# for comment in Comment.query.filter_by(post_id=post_id):
	# 	comments.append(comment.as_dict())

	post_comment_form = CommentForm()
	comment_comment_form = CommentForm()

	post_date_posted = post.date_posted_ago()

	author_followed = False
	post_liked_status = 'undefined'
	if current_user.is_authenticated:
		# Post View
		if post in current_user.posts_viewed:
			current_user.posts_viewed.remove(post)
			db.session.commit()

		current_user.posts_viewed.append(post)

		# Post Like
		if post in current_user.posts_liked:
			post_liked_status = 'liked'
		elif post in current_user.posts_disliked:
			post_liked_status = 'disliked'

		# Author Following
		if post.author in current_user.following:
			author_followed = True

	splinted = re.split('{{|}}', post.content)

	for i, splint in enumerate(splinted):
		if splint == '':
			splinted.pop(i)

	post.views += 1
	db.session.commit()

	return render_template('post.html', title=post.title, post=post, post_date_posted=post_date_posted,
						   splinted=splinted, comments=comments, post_comment_form=post_comment_form,
						   comment_comment_form=comment_comment_form, post_liked_status=post_liked_status,
						   author_followed=author_followed)


@posts.route('/load_comments', methods=['POST'])
def load_comments():
	if request.args:
		counter = int(request.args.get('c'))
		if counter == 0:
			res = make_response(jsonify(comments[0: quantity]), 200)
		elif counter > len(comments) + quantity:
			res = make_response(jsonify({}), 200)
		else:
			res = make_response(jsonify(comments[quantity: quantity + counter]), 200)

	return res


@posts.route('/post_comment/like', methods=["POST"])
def like_dislike():
	post_id = request.json.get('post_id')
	comment_id = request.json.get('comment_id')

	liked_status = 'undefined'

	if post_id:
		post = Post.query.get_or_404(post_id)
		# Liking Post
		if post in current_user.posts_liked:
			liked_status = 'liked'
		elif post in current_user.posts_disliked:
			liked_status = 'disliked'

		if request.json['action'] == 'like':
			if liked_status == 'liked':
				current_user.posts_liked.remove(post)
			elif liked_status == 'undefined':
				current_user.posts_liked.append(post)
			elif liked_status == 'disliked':
				current_user.posts_disliked.remove(post)
				current_user.posts_liked.append(post)
		elif request.json['action'] == 'dislike':
			if liked_status == 'disliked':
				current_user.posts_disliked.remove(post)
			elif liked_status == 'undefined':
				current_user.posts_disliked.append(post)
			elif liked_status == 'liked':
				current_user.posts_liked.remove(post)
				current_user.posts_disliked.append(post)

		db.session.commit()
		return make_response(jsonify({'status': 'success', 'previous_liked_status': liked_status}))
	elif comment_id:
		comment = Comment.query.get_or_404(comment_id)
		# Liking Comment
		if comment in current_user.comments_liked:
			liked_status = 'liked'
		elif comment in current_user.comments_disliked:
			liked_status = 'disliked'

		if request.json['action'] == 'like':
			if liked_status == 'liked':
				current_user.comments_liked.remove(comment)
			elif liked_status == 'undefined':
				current_user.comments_liked.append(comment)
			elif liked_status == 'disliked':
				current_user.comments_disliked.remove(comment)
				current_user.comments_liked.append(comment)

		elif request.json['action'] == 'dislike':
			if liked_status == 'disliked':
				current_user.comments_disliked.remove(comment)
			elif liked_status == 'undefined':
				current_user.comments_disliked.append(comment)
			elif liked_status == 'liked':
				current_user.comments_liked.remove(comment)
				current_user.comments_disliked.append(comment)

		db.session.commit()
		return make_response(jsonify({'status': 'success', 'previous_liked_status': liked_status}))
	else:
		return make_response(jsonify({'status': 'failure'}))


@posts.route("/comment", methods=["POST"])
def comment():
	post_id = request.args.get('post_id')
	comment_id = request.args.get('comment_id')

	post = Post.query.get_or_404(post_id)
	post.views -= 1

	if comment_id:
		# Commenting under another comment
		comment_comment_form = CommentForm()
		comment = Comment.query.get_or_404(comment_id)

		if comment_comment_form.validate_on_submit():
			created_comment = Comment(content=comment_comment_form.content.data, author=current_user,
									  parent=Post.query.get(post_id), comment_id=comment.id)
			db.session.add(created_comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))
	else:
		# Commenting directly to post
		post_comment_form = CommentForm()

		if post_comment_form.validate_on_submit():
			created_comment = Comment(content=post_comment_form.content.data, author=current_user,
									  parent=Post.query.get(post_id))
			db.session.add(created_comment)
			db.session.commit()
			return redirect(url_for('posts.post', post_id=post_id))


@posts.route("/post/<int:post_id>/update", methods=["GET", "POST"])
@login_required
def update_post(post_id):
	post = Post.query.filter_by(id=post_id, author=current_user).first()

	if not post:
		abort(404)

	post_temp_cache = PostCache.query.filter_by(post_id=post.id, user_id=current_user.id).first()

	post_form = PostForm()

	if request.method == "GET":
		if post_temp_cache:
			splinted = re.split('{{|}}', post_temp_cache.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i + 1] == EMPTY_CODE:
							splinted.pop(i + 1)

			post_form.title.data = post_temp_cache.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('update_post.html', title='Update Post', post_id=post.id, post_form=post_form,
								   uploaded_media=uploaded_media, splinted=splinted)
		else:
			splinted = re.split('{{|}}', post.content)

			for i, splint in enumerate(splinted):
				if splint == '':
					splinted.pop(i)

			for i, splint in enumerate(splinted):
				if splint == EMPTY_CODE:
					if len(splinted) > i + 1:
						if splinted[i + 1] == EMPTY_CODE:
							splinted.pop(i + 1)

			post_form.title.data = post.title
			uploaded_media = Media.query.filter_by(user_id=current_user.id).order_by(Media.date_uploaded.desc())
			return render_template('update_post.html', title='Update Post', post_id=post.id, post_form=post_form,
								   uploaded_media=uploaded_media, splinted=splinted)
	elif request.method == "POST":
		post_temp_cache = PostCache.query.filter_by(post_id=post.id, user_id=current_user.id).first()
		if not post_temp_cache:
			post_temp_cache = PostCache(user_id=current_user.id, post_id=post.id)
			db.session.add(post_temp_cache)

		unsorted_items = []
		for item in request.form:
			if item.isdigit():
				unsorted_items.append(int(item))

		unsorted_items.sort()

		items = {}
		for item in unsorted_items:
			items[item] = request.form.get(str(item))

		post_temp_cache.title = post_form.title.data
		post_temp_cache.content = ""
		for item_id in items:
			found_media = Media.query.filter_by(user_id=current_user.id, file=items[item_id]).first()
			if found_media:
				media_size = request.form.get(f'size-{item_id}')
				edited_item_name = f'{{{{{found_media.file}|:{media_size}:|{MEDIA_CODE}}}}}'
				post_temp_cache.content += edited_item_name
			elif items[item_id] != '':
				post_temp_cache.content += items[item_id]
			else:
				post_temp_cache.content += f'{{{{{EMPTY_CODE}}}}}'

		if post_form.import_file.data:
			if 'import_file' not in request.files:
				flash('No file part')

			blob = request.files['import_file'].read()
			size = len(blob)
			if size > 1024 * 1024 * 5:
				flash('Uploads must be under 5 Megabytes', 'danger')
				return redirect(url_for('posts.update_post', post_id=post.id))

			file = post_form.import_file.data

			if file.filename == '':
				flash('No selected file')
			if file and allowed_file(file.filename):
				uploaded_file_path = save_file(file)
				uploaded_file = Media(user_id=current_user.id, file=uploaded_file_path)

				edited_file_path = f'{{{{{uploaded_file_path}|:50:|{MEDIA_CODE}}}}}'

				post_temp_cache.content += edited_file_path + f'{{{{{EMPTY_CODE}}}}}'

				db.session.add(uploaded_file)
				db.session.commit()
				return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.file.data:
			post_temp_cache.content += f'{{{{{post_form.file.data}|:50:|{MEDIA_CODE}}}}}' + f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.add_empty.data and post_form.validate():
			post_temp_cache.content += f'{{{{{EMPTY_CODE}}}}}'
			db.session.commit()
			return redirect(url_for('posts.update_post', post_id=post.id))
		elif post_form.submit.data and post_form.validate():
			post.title = post_temp_cache.title
			post.content = post_temp_cache.content

			if PostCache.query.filter_by(post_id=post.id, user_id=current_user.id).first():
				db.session.delete(post_temp_cache)

			db.session.commit()
			return redirect(url_for('posts.post', post_id=post.id))
		else:
			return redirect(url_for('posts.update_post', post_id=post.id))


@posts.route("/post/<int:post_id>/delete", methods=["POST"])
@login_required
def delete_post(post_id):
	post_temp_cache_1_0 = request.args.get('post_temp_cache_1_0')

	if post_temp_cache_1_0 == '1':
		post_temp_cache = PostCache.query.filter_by(post_id=post_id, user_id=current_user.id).first()

		if post_temp_cache:
			db.session.delete(post_temp_cache)
			db.session.commit()

		return ''
	elif post_temp_cache_1_0 == '0':
		post = Post.query.filter_by(id=post_id, user_id=current_user.id).first()

		db.session.delete(post)
		db.session.commit()
		flash('Post Deleted.', 'success')
		return redirect(url_for('main.home'))
