import os
from PIL import Image
from flask import current_app
from werkzeug.utils import secure_filename

image_file_ext = ['png', 'jpg', 'jpeg', 'gif']


def allowed_image_file(filename):
	secure_filename(filename)
	return filename.split('.')[1] in image_file_ext


def allowed_file(filename):
	secure_filename(filename)
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_file_ext


def save_file(file, current_user_id):
	_, f_ext = os.path.splitext(secure_filename(file.filename))
	file_filename = f'{current_user_id}{f_ext}'

	if allowed_image_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/images/profile_pics', file_filename)
		file.seek(0)
		output_size = (128, 128)
		img = Image.open(file)
		img.thumbnail(output_size)
		img.save(path)
		return file_filename


def delete_previous_file(file_name):
	file = os.path.join(current_app.root_path, 'static/images/profile_pics', file_name)
	os.remove(file)
