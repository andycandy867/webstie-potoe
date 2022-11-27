import os
from PIL import Image
from flask import current_app
from flask_login import current_user


def save_picture(form_picture):
    if current_user.image_file != 'default.jpg':
        # Save Picture in other div?
        for root, dirs, files in os.walk(os.path.join(current_app.root_path, 'static/images/profile_pics')):
            if current_user.id in files:
                file_ext = os.path.join(root, current_user.id)
                os.remove(f'{os.path.join(current_app.root_path, "static/images/profile_pics", current_user.id)}.{file_ext}')
                break

    _, f_ext = os.path.splitext(form_picture.filename)
    picture_filename = f'{current_user.id}{f_ext}'
    picture_path = os.path.join(current_app.root_path, 'static/images/profile_pics', picture_filename)

    output_size = (128, 128)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)

    return picture_filename
