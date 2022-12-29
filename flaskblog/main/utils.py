import re


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
