import re
from datetime import datetime
from flask import render_template, url_for, flash, redirect, request, make_response, jsonify, Blueprint
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.models import Post, Collection
from flaskblog.collections.forms import RenameCollectionForm, UpdateCollectionImageForm
from flaskblog.collections.utils import allowed_file, save_file, delete_previous_file


collections = Blueprint('collections', __name__)


@collections.route('/collection', methods=["GET"])
def collection():
	collection_id = request.args.get('list')
	rename_collection_form = RenameCollectionForm()
	update_collection_image_form = UpdateCollectionImageForm()

	if collection_id:
		if current_user.is_authenticated:
			if collection_id == "RL":
				collection = Collection.query.filter_by(user_id=current_user.id, type="RL").first()
			else:
				collection = Collection.query.get_or_404(collection_id)

				if collection.type == 'RL':
					return redirect(url_for('collections.collection', list='RL'))
		else:
			if collection_id == "RL":
				return render_template("/sign_in_prompts/collection.html")
			else:
				collection = Collection.query.get_or_404(collection_id)

				if collection.type == 'RL':
					return redirect(url_for('collections.collection', list='RL'))
	else:
		return redirect(url_for("main.home"))

	limit_content = {}
	for post in collection.posts:
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

	return render_template('collection.html', title=collection.name, collection=collection,
						   collection_id=collection_id, limit_content=limit_content,
						   rename_collection_form=rename_collection_form,
						   update_collection_image_form=update_collection_image_form)


@collections.route("/collection/create", methods=["POST"])
@login_required
def collection_create():
	# Validate length of request.json.get("name")
	collection = Collection(user_id=current_user.id, name=request.json.get("name"))
	db.session.add(collection)
	db.session.commit()

	return make_response(jsonify({"status": "success", "collection_id": collection.id,
									  "collection_name": collection.name}))


@collections.route("/collection/edit", methods=["POST"])
@login_required
def collection_edit():
	collection_id = request.args.get('list')
	action = request.args.get("action")

	if collection_id and action:
		if collection_id == "RL":
			collection = Collection.query.filter_by(user_id=current_user.id, type="RL").first()
		else:
			collection = Collection.query.get_or_404(collection_id)
	else:
		return redirect(url_for("main.home"))

	if collection.user_id == current_user.id:
		if not collection.type:
			if action == "rename":
				rename_collection_form = RenameCollectionForm()

				if rename_collection_form.validate_on_submit():
					previous_collection_name = collection.name
					collection.name = rename_collection_form.name.data
					collection.date_updated = datetime.utcnow()
					db.session.commit()

					flash(
						f'Collection "{previous_collection_name}" has successfully been renamed to "{rename_collection_form.name.data}"',
						"success")
			elif action == "update_img":
				update_collection_image_form = UpdateCollectionImageForm()

				if update_collection_image_form.validate_on_submit():
					if update_collection_image_form.import_image_file.data:
						if 'import_image_file' not in request.files:
							flash('No file part')

						blob = request.files['import_image_file'].read()
						size = len(blob)
						if size > 1024 * 1024 * 5:
							flash('Uploads must be under 5 Megabytes', 'danger')
							return redirect(url_for('collections.collection', list=collection_id))

						file = update_collection_image_form.import_image_file.data

						if file.filename == '':
							flash('No selected file')
						if file and allowed_file(file.filename):
							if collection.image_file != "default_banner.jpg":
								delete_previous_file(collection.image_file)
							uploaded_file_path = save_file(file, collection.id)

							collection.image_file = uploaded_file_path
							db.session.commit()
			elif action == "delete":
				if collection.image_file != "default_banner.jpg":
					delete_previous_file(collection.image_file)

				db.session.delete(collection)
				db.session.commit()

				flash(f'Collection "{collection.name}" has successfully been deleted', "success")
				return redirect(url_for("main.home"))

		if action == "add":
			post = Post.query.get_or_404(request.json.get("post_id"))

			if post not in collection.posts:
				collection.posts.append(post)
				collection.date_updated = datetime.utcnow()

				db.session.commit()
				return make_response(jsonify({"status": "success"}))

			return make_response(jsonify({"status": "failure"}))
		if action == "update":
			post = Post.query.get_or_404(request.json.get("post_id"))

			if post in collection.posts:
				collection.posts.remove(post)
				response = make_response(jsonify({"status": "success", "in_collection": False}))
			else:
				collection.posts.append(post)
				response = make_response(jsonify({"status": "success", "in_collection": True}))

			collection.date_updated = datetime.utcnow()
			db.session.commit()
			return response
		elif action == "remove":
			post = Post.query.get_or_404(request.json.get("post_id"))

			if post in collection.posts:
				collection.posts.remove(post)

				collection.date_updated = datetime.utcnow()
				db.session.commit()
				return make_response(jsonify({"status": "success"}))

			return make_response(jsonify({"status": "failure"}))
	else:
		if action == "delete":
			flash(f'Collection "{collection.name}" cannot be deleted', "danger")
		elif action == "rename":
			flash(f'Collection "{collection.name}" cannot be renamed', "danger")
		elif action == "update_img":
			flash(f'Collection "{collection.name}" cannot be updated', "danger")

	return redirect(url_for("collections.collection", list=collection.id))
