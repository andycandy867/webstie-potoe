import os
from flask import current_app
from werkzeug.utils import secure_filename


image_file_ext = ['png', 'jpg', 'jpeg', 'gif']


def allowed_image_file(filename):
	secure_filename(filename)
	return filename.split('.')[1] in image_file_ext


def allowed_file(filename):
	secure_filename(filename)
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_file_ext


def save_file(file, collection_id):
	_, f_ext = os.path.splitext(secure_filename(file.filename))
	file_filename = f'{collection_id}{f_ext}'

	if allowed_image_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/images/collection_banners', file_filename)
		file.seek(0)
		file.save(path)
		return file_filename


def delete_previous_file(file_name):
	file = os.path.join(current_app.root_path, 'static/images/collection_banners', file_name)
	os.remove(file)
