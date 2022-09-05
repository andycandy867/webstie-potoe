// Preferences Menu
const kebab_img = document.querySelector('#kebab-img')
let preferences_menu = document.querySelector('#preferences-menu')

let preferences_menu_active = false

function hide_preferences_menu() {
	preferences_menu_active = false
	preferences_menu.style.display = 'none'
}

function show_preferences_menu() {
	preferences_menu_active = true
	preferences_menu.style.display = 'flex'
}

if (kebab_img) {
	kebab_img.addEventListener('click', e => {
		e.stopPropagation()

		if (preferences_menu_active == false) {
			show_preferences_menu()
		} else if (preferences_menu_active == true) {
			hide_preferences_menu()
		}
	})

	preferences_menu.addEventListener('click', e => {
		e.stopPropagation()
	})
}


// Profile Menu
const profile_img = document.querySelector('#profile-img')
const dropdown_menu = document.querySelector('#profile-menu')

let dropdown_menu_active = false

function hide_dropdown_menu() {
	dropdown_menu_active = false
	dropdown_menu.style.display = 'none'
}

function show_dropdown_menu() {
	dropdown_menu_active = true
	dropdown_menu.style.display = 'flex'
}

if (profile_img) {
	profile_img.addEventListener('click', e => {
		e.stopPropagation()

		if (dropdown_menu_active == false) {
			show_dropdown_menu()
		} else if (dropdown_menu_active == true) {
			hide_dropdown_menu()
		}
	})

	dropdown_menu.addEventListener('click', e => {
		e.stopPropagation()
	})
}


// Side Menu
const menu_img = document.querySelector('#menu-img')
const active_side_menu = document.querySelector('.left-nav')

const hidden_side_menu = document.querySelector('#side-menu')
let hidden_side_menu_active = false

function hide_hidden_side_menu() {
	hidden_side_menu_active = false
	hidden_side_menu.style.width = 0

	active_side_menu.style.display = 'flex'
}

function show_hidden_side_menu() {
	active_side_menu.style.display = 'none'

	hidden_side_menu_active = true
	hidden_side_menu.style.width = '240px'
}

menu_img.addEventListener('click', e => {
	e.stopPropagation()

	if (hidden_side_menu_active == false) {
		show_hidden_side_menu()
	} else if (hidden_side_menu_active == true) {
		hide_hidden_side_menu()
	}
})

hidden_side_menu.addEventListener('click', e => {
	e.stopPropagation()
})

// Hides All Menus
document.addEventListener('click', () => {
	if (preferences_menu_active) {
		hide_preferences_menu()
	}

	if (dropdown_menu_active) {
		hide_dropdown_menu()
	}

	if (hidden_side_menu_active) {
		hide_hidden_side_menu()		
	}
})

// Text Box Auto Resizing
const comment_inputs = document.querySelectorAll(".comment-input");

function autoResize() {
	this.style.height = 'auto';
	this.style.height = this.scrollHeight + 'px';
}

comment_inputs.forEach(textarea => {
	textarea.addEventListener('input', autoResize, false);
})


// Submit Post after pressing Insert Submit
const create_post_form = document.querySelector("#create-post-form")
const insert_submit_button = document.querySelector("#insert-form-submit-button")

insert_submit_button.addEventListener('click', e => {
	alert('pressed submit')
	create_post_form.submit()
})
