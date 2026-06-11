# Shared / site images

Post images now live **inside each post's own folder** under `src/posts/`
(co-located with the markdown), referenced by file name in the `image:`
frontmatter or inline with the `{% name %}` tag. See the project README.

This `public/images/` folder is only for **shared** images you want to
reference from anywhere by absolute path, e.g. `image: /images/shared.jpg`
in frontmatter. It is optional — you can leave it empty.
