from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from flask_login import current_user
from flaskblog.models import User


class UpdateAccountForm(FlaskForm):
	username = StringField(validators=[DataRequired(), Length(min=3, max=16)])
	email = StringField(validators=[DataRequired(), Email()])
	question = SelectField('Security Question', choices=['What state were you born in?', 'What is the name of your favorite pet?'])
	answer = StringField()
	picture = FileField(validators=[FileAllowed(['png', 'jpg', 'jpeg', 'gif'])])
	save_changes = SubmitField()

	def validate_username(self, username):
		if username.data != current_user.username:
			user = User.query.filter_by(username=username.data).first()
			if user:
				raise ValidationError(f'The username "{username.data}" is already taken. Please choose a different username')

	def validate_email(self, email):
		if email.data != current_user.email:
			user = User.query.filter_by(email=email.data).first()
			if user:
				raise ValidationError(f'A user with the email "{email.data}" already exists.')


class ResetPasswordForm(FlaskForm):
	password = PasswordField(validators=[DataRequired()])
	confirm_password = PasswordField(validators=[DataRequired(), EqualTo('password')])
	save_password = SubmitField()
