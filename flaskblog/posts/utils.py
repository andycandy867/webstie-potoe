import os
import secrets
from flask import current_app
from flask_login import current_user
from werkzeug.utils import secure_filename


image_file_ext = ['png', 'jpg', 'jpeg']
video_file_ext = ['mp4']


def allowed_image_file(file_ext):
	return file_ext.split('.')[1] in image_file_ext


def allowed_video_file(file_ext):
	return file_ext.split('.')[1] in video_file_ext


def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in (image_file_ext + video_file_ext)


def save_file(form_file):
	_, f_ext = os.path.splitext(form_file.filename)
	random_hex = secrets.token_hex(8)
	raw_file_filename = secure_filename(form_file.filename)
	file_filename = raw_file_filename.rsplit('.', 1)[0].lower()
	final_file_fn = f'{current_user.id}_{file_filename}_{random_hex}{f_ext}'

	if allowed_image_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/images', final_file_fn)
		form_file.save(path)
		return f'images/{final_file_fn}'
	elif allowed_video_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/videos', final_file_fn)
		form_file.save(path)
		return f'videos/{final_file_fn}'
