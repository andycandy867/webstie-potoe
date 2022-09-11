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


// Insert Media Menu
const insert_media_button = document.querySelector('#create-post-insert-button')
const insert_media_menu = document.querySelector('#create-post-insert-menu')

let insert_media_menu_active = false

function hide_insert_media_menu() {
	insert_media_menu_active = false
	insert_media_menu.style.display = 'none'
}

function show_insert_media_menu() {
	insert_media_menu_active = true
	insert_media_menu.style.display = 'flex'
}

insert_media_button.addEventListener('click', e => {
	e.stopPropagation()

	if (insert_media_menu_active == false) {
		show_insert_media_menu()
	} else if (insert_media_menu_active == true) {
		hide_insert_media_menu()
	}
})

// Input Options Menu
const input_options_openers = document.querySelectorAll('.options-opener')

input_options_openers.forEach(element => {
	let input_options_menu = element.nextElementSibling

	element.addEventListener('click', e => {
		e.stopPropagation()

		if (input_options_menu.style.display == 'none') {
			input_options_menu.style.display = 'block'
		} else if (input_options_menu.style.display == 'block') {
			input_options_menu.style.display = 'none'
		}
	})
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

	if (insert_media_menu_active) {
		hide_insert_media_menu()		
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


// Select Media to insert and then submit
const media_selects = document.querySelectorAll(".media-select")
const hidden_file_input = document.querySelector("#file")
const create_post_form = document.querySelector("#create-post-form")

function select_media() {
	media_source = this.getAttribute('src')
	hidden_file_input.setAttribute('value', media_source.replace('/static/', ''))
	create_post_form.requestSubmit()
}

media_selects.forEach(media => {
	media.addEventListener('click', select_media)
})

// Hover over input element for more actions
const input_elements = document.querySelectorAll('.input-element')

function display_element_options() {
	let prevSibling = this.querySelector('div')
	prevSibling.style.display = 'block'
}

function hide_element_options() {
	let prevSibling = this.querySelector('div')
	prevSibling.style.display = 'none'
}

input_elements.forEach(element => {
	element.addEventListener('mouseover', display_element_options)
	element.addEventListener('mouseleave', hide_element_options)
})

// Activates Buttons from Imported Media
const imported_medias_containers = document.querySelectorAll('.uploaded-media-container')

imported_medias_containers.forEach(element => {
	let button = element.querySelector('.uploaded-media-remove')
	button.addEventListener('click', remove)
})