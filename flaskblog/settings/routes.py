from flask import render_template, url_for, flash, redirect, request, Blueprint
from flask_login import current_user, login_required
from flaskblog import db
from flaskblog.settings.forms import UpdateAccountForm
from flaskblog.settings.utils import save_picture


settings = Blueprint('settings', __name__)


@settings.route("/account", methods=["GET", "POST"])
@login_required
def account():
	form = UpdateAccountForm()

	if request.method == 'GET':
		form.username.data = current_user.username
		form.email.data = current_user.email
		return render_template('account.html', title='Account', form=form)
	elif request.method == 'POST':
		if form.validate_on_submit():
			if form.picture.data:
				picture_file = save_picture(form.picture.data)
				current_user.image_file = picture_file

			current_user.username = form.username.data
			current_user.email = form.email.data
			db.session.commit()
			flash('Saved Changes', 'success')
			return redirect(url_for('users.account'))

		return render_template('account.html', title='Account', form=form)


@settings.route("/settings", methods=["GET", "POST"])
def main_settings():
	return render_template('settings.html', title='Settings')
