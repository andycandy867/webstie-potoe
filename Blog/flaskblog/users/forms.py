from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from flask_login import current_user
from flaskblog.models import User


class RegistrationForm(FlaskForm):
	username = StringField(validators=[DataRequired(), Length(min=3, max=16)])
	email = StringField(validators=[DataRequired(), Email()])
	password = PasswordField(validators=[DataRequired()])
	confirm_password = PasswordField(validators=[DataRequired(), EqualTo('password')])
	submit = SubmitField()

	def validate_username(self, username):
		user = User.query.filter_by(username=username.data).first()
		if user:
			raise ValidationError(f'The username "{username.data}" is already taken. Please choose a different username')

	def validate_email(self, email):
		user = User.query.filter_by(email=email.data).first()
		if user:
			raise ValidationError(f'A user with the email "{email.data}" already exists.')


class SignInForm(FlaskForm):
	email = StringField(validators=[DataRequired(), Email()])
	password = PasswordField(validators=[DataRequired()])
	remember = BooleanField()
	submit = SubmitField()


class UpdateAccountForm(FlaskForm):
	username = StringField(validators=[DataRequired(), Length(min=3, max=16)])
	email = StringField(validators=[DataRequired(), Email()])
	picture = FileField(validators=[FileAllowed(['png', 'jpg'])])
	submit = SubmitField()

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


class RequestResetForm(FlaskForm):
	email = StringField('Email', validators=[DataRequired(), Email()])
	submit = SubmitField('Request Password Reset')


class ResetPasswordForm(FlaskForm):
	password = PasswordField('Password', validators=[DataRequired()])
	confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
	submit = SubmitField('Reset Password')
