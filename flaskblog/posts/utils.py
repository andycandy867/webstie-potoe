import os
import re
import secrets
from flask import current_app
from flask_login import current_user
from werkzeug.utils import secure_filename


def limit_content_posts(posts):
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

	return limit_content


image_file_ext = ['png', 'jpg', 'jpeg']
video_file_ext = ['mp4']


def allowed_image_file(file_ext):
	return file_ext.split('.')[1] in image_file_ext


def allowed_video_file(file_ext):
	return file_ext.split('.')[1] in video_file_ext


def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in (image_file_ext + video_file_ext)


def save_file(file):
	_, f_ext = os.path.splitext(file.filename)
	random_hex = secrets.token_hex(8)
	raw_file_filename = secure_filename(file.filename)
	file_filename = raw_file_filename.rsplit('.', 1)[0].lower()
	final_file_fn = f'{current_user.id}_{file_filename}_{random_hex}{f_ext}'

	if allowed_image_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/images', final_file_fn)
		file.seek(0)
		file.save(path)
		return f'images/{final_file_fn}'
	elif allowed_video_file(f_ext):
		path = os.path.join(current_app.root_path, 'static/videos', final_file_fn)
		file.seek(0)
		file.save(path)
		return f'videos/{final_file_fn}'
