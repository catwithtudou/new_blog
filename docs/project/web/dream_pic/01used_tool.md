# 组件工具梳理

## 构建部署

### air

> repo:https://github.com/air-verse/air

- 简介：Live reload for Go apps

- Features:
	- Colorful log output
	- Customize build or any command
	- Support excluding subdirectories
	- Allow watching new directories after Air started
	- Better building process

### supabase

> repo:https://github.com/supabase/supabase

- 简介：Supabase is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade
  open source tools

## 前端

### tailwindcss

> repo:https://github.com/tailwindlabs/tailwindcss

- 简介：只需书写 HTML 代码，无需书写 CSS，即可快速构建美观的网站

### daisyui

> repo:https://github.com/saadeghi/daisyui

- 简介：The most popular component library for Tailwind CSS

## 服务端

### templ

> repo:https://github.com/a-h/templ

- 简介：A language for writing HTML user interfaces in Go

- Features:
	- Server-side rendering: Deploy as a serverless function, Docker container, or standard Go program
	- Static rendering: Create static HTML files to deploy however you choose
	- Compiled code: Components are compiled into performant Go code
	- Use Go: Call any Go code, and use standard if, switch, and for statements
	- No JavaScript: Does not require any client or server-side JavaScript
	- Great developer experience: Ships with IDE autocompletion

### htmx

> repo:https://github.com/bigskysoftware/htmx

- 简介：htmx gives you access to AJAX, CSS Transitions, WebSockets and Server Sent Events directly in HTML, using
  attributes, so you can build modern user interfaces with the simplicity and power of hypertext

### chi

> repo:https://github.com/go-chi/chi

- 简介：lightweight, idiomatic and composable router for building Go HTTP services

- Features:
	- Lightweight - cloc'd in ~1000 LOC for the chi router
	- Fast - yes, see benchmarks
	- 100% compatible with net/http - use any http or middleware pkg in the ecosystem that is also compatible with
	  net/http
	- Designed for modular/composable APIs - middlewares, inline middlewares, route groups and sub-router mounting
	- Context control - built on new context package, providing value chaining, cancellations and timeouts
	- Robust - in production at Pressly, Cloudflare, Heroku, 99Designs, and many others (see discussion)
	- Doc generation - docgen auto-generates routing documentation from your source to JSON or Markdown
	- Go.mod support - as of v5, go.mod support (see CHANGELOG)
	- No external dependencies - plain ol' Go stdlib + net/http

### gorilla/sessions

> repo:https://github.com/gorilla/sessions

- 简介：Package gorilla/sessions provides cookie and filesystem sessions and infrastructure for custom session backends

- Features:
	- Simple API: use it as an easy way to set signed (and optionally encrypted) cookies
	- Built-in backends to store sessions in cookies or the filesystem
	- Flash messages: session values that last until read
	- Convenient way to switch session persistency (aka "remember me") and set other attributes
	- Mechanism to rotate authentication and encryption keys
	- Multiple sessions per request, even using different backends
	- Interfaces and infrastructure for custom session backends: sessions from different stores can be retrieved and
	  batch-saved using a common API

### golang-migrate/migrate

> repo:https://github.com/golang-migrate/migrate

- 简介：Database migrations written in Go. Use as CLI or import as library

- Features:
   - Migrate reads migrations from sources and applies them in correct order to a database.
   - Drivers are "dumb", migrate glues everything together and makes sure the logic is bulletproof. (Keeps the drivers lightweight, too.)
   - Database drivers don't assume things or try to correct user input. When in doubt, fail.

### uptrace/bun

> repo:https://github.com/uptrace/bun

- 简介：SQL-first Golang ORM for PostgreSQL, MySQL, MSSQL, and SQLite

- Features:
	- Works with PostgreSQL, MySQL (including MariaDB), MSSQL, SQLite
	- ORM-like experience using good old SQL. Bun supports structs, map, scalars, and slices of map/structs/scalars
	- Bulk inserts
	- Bulk updates using common table expressions
	- Bulk deletes
	- Fixtures
	- Migrations
	- Soft deletes

### godotenv

> repo:https://github.com/joho/godotenv

- 简介：A Go port of Ruby's dotenv library (Loads environment variables from .env files)

### replicate-go


> repo:https://github.com/replicate/replicate-go

- 简介：A Go client for Replicate. It lets you run models from your Go code, and everything else you can do with Replicate's HTTP API

## 三方平台

### webhook

> repo:https://github.com/webhooksite/webhook.site
> url:https://webhook.site

- 简介：Easily test HTTP webhooks with this handy tool that displays requests instantly

### replicate

> url:https://replicate.com/

- 简介：Replicate makes it easy to run machine learning models in the cloud from your own code
