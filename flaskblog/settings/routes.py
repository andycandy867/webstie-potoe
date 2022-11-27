from flask import render_template, url_for, flash, redirect, request, Blueprint
from flask_login import current_user, login_required
from flaskblog import db, bcrypt
from flaskblog.settings.forms import UpdateAccountForm, ResetPasswordForm
from flaskblog.settings.utils import save_picture


settings = Blueprint('settings', __name__)


@settings.route("/account", methods=["GET", "POST"])
@login_required
def account():
	form = UpdateAccountForm()

	if request.method == 'GET':
		form.username.data = current_user.username
		form.email.data = current_user.email
		form.question.data = current_user.security_question
		form.answer.data = current_user.security_question_answer
		return render_template('account.html', title='Account', form=form)
	elif request.method == 'POST':
		if form.validate_on_submit():
			if form.picture.data:
				picture_file = save_picture(form.picture.data)
				current_user.image_file = picture_file

			current_user.username = form.username.data
			current_user.email = form.email.data
			current_user.security_question = form.question.data
			current_user.security_question_answer = form.answer.data
			db.session.commit()
			flash('Saved Changes', 'success')
			return redirect(url_for('settings.account'))

	return render_template('account.html', title='Account', form=form)


@settings.route("/reset_password", methods=["GET", "POST"])
@login_required
def reset_password():
	form = ResetPasswordForm()

	if request.method == 'GET':
		return render_template('reset_password.html', title='Reset Password', form=form)
	elif request.method == 'POST':
		if form.validate_on_submit():
			user = current_user
			hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
			user.password = hashed_password
			db.session.commit()
			flash('Password Successfully Updated', category='success')
			return redirect(url_for('settings.account'))


@settings.route("/settings", methods=["GET", "POST"])
def main_settings():
	return render_template('settings.html', title='Settings')
