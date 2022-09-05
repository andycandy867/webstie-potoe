import os
from PIL import Image
from flask import current_app, url_for
from flask_login import current_user
from flask_mail import Message
from flaskblog import mail


def save_picture(form_picture):
    if current_user.image != 'default.jpg':
        # Save Picture in other div?
        for root, dirs, files in os.walk(os.path.join(current_app.root_path, 'static/images/profile_pics')):
            if current_user.id in files:
                file_ext = os.path.join(root, current_user.id)
                os.remove(f'{os.path.join(current_app.root_path, "static/images/profile_pics", current_user.id)}.{file_ext}')
                break

    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = f'{current_user.id}{f_ext}'
    picture_path = os.path.join(current_app.root_path, 'static/images/profile_pics', picture_fn)

    output_size = (128, 128)
    i = Image.open(form_picture)
    i.thumbnail(output_size)
    i.save(picture_path)

    return picture_fn


def send_reset_email(user):
    token = user.get_reset_token()
    msg = Message('Password Reset Request',
                  sender='noreply@demo.com',
                  recipients=[user.email])
    msg.body = f'''To reset your password, visit the following link:
{url_for('reset_token', token=token, _external=True)}

If you did not make this request, you can ignore this email and no changes will be made to your account.
'''
    mail.send(msg)
