# La Porta d'Acqua v2 - Angular

This is the frontend of the second version of [laportadacqua.com](https://laportadacqua.com).

It's written in Angular (v17+).

I'm going to use some libraries:
- Tailwind
- TaigaUi
- @angular/localize
- (probably) @angular/material

Using node `v20.10.0` and npm `10.2.3`

# Preferences and Settings

Preferences and Settings are the same thing.

The only difference is that Preferences are user-specific settings, while Settings are application-wide settings.

## Localization
`ng extract-i18n` will generate the .xlf file with all the translations inside `localize` folder.

### Translating
If you want to translate application manually, you can use a tool like [poeditor.com](https://poeditor.com).
In that case you may want to select only the "missing" translations. For that you can se `scripts/xlf-missing`. See the file for docs.

Otherwise you can translate the entire file using OpenAI capabilities. Just create a OpenAI key, add it to `scripts/.openai`, and run `ruby scripts/xlf-translate.rb locales/messages.xlf locales/messages.en.xlf`.

### After done translating

When you're done translating, you should have the localization files inside `locales` folder in the root of the project.

You can build the application with `./scripts/build.sh`.

Then, if you want to push to build repository, you can run `./scripts/push.sh`. Ensure you have cloned the build repository inside `../build-angular-lpda2` folder.

## Local build
For testing local builds, I build the application with `ng build` and then copy it to `/var/www/lpda2` folder.

I then serve it with nginx. See production repository for nginx configuration.

```bash
ng build -c development --localize

./scripts/adjust-configs.sh

sudo rm -rf /var/www/lpda2/* && sudo cp -r dist/lpda2/* /var/www/lpda2/ && sudo chown www-data:www-data -R /var/www/lpda2/
```

## Poeditor
Login to [poeditor.com](https://poeditor.com)

## CORS setup
In Angular, create a interceptor that does allow credentials from different origins. [Read more here](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials) and [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie). Otherwise cookie-based authentication will fail.

```typescript
export function permitCORSCredentialsInterceptor(request: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  request = request.clone({ withCredentials: true });

  // ....
}
```

Then, setup the [backend](https://github.com/kirpachov/lpda2-rails) side.


## Local development setup
Allows you to see the webapp from the phone, if in the same network.
```bash
# 1. Update config.(example).json and set your private ip on "api.domain"
# 2. Update proxy.conf.json same

ng s --host 0.0.0.0 --disable-host-check
```

## Local production setup with nginx
After backend local setup was done:

- Prepare nginx configuration in `sudo vim /etc/nginx/sites-enabled/lpda2-frontend`, then `sudo nginx -t && sudo service nginx reload`
- Build `ng build --watch -c development --localize --output-path=/var/www/lpda2`
- (if issues with permissions) `sudo mkdir -p /var/www/lpda2 && sudo adduser "$(whoami)" www-data && sudo adduser www-data "$(whoami)" && sudo chown "$(whoami):www-data" -R /var/www/lpda2`

Note that some things may not work properly but it's the most efficient way to see what you would see in production.
For a more precise setup, you can build with: `./scripts/build.sh && rm -rf /var/www/lpda2/* && cp -r dist/lpda2/* /var/www/lpda2`

Note that you may need to update `config.json` or `config.prod.json`, maybe something like:
```bash
{
  "api.domain": "lpda2api.localhost",
  "api.secure": "false",
  "api.path": "/"
}
```

Nginx configuration: `sudo vim /etc/nginx/sites-enabled/lpda2-frontend`
```bash
server {
	listen 80;

	server_name lpda2.localhost;

	root /var/www/lpda2;
	try_files $uri $uri/ /index.html;

	set $first_language $http_accept_language;
	if ($http_accept_language ~* '^(.+?),') {
		set $first_language $1;
	}

	set $language_suffix 'en';
	if ($first_language ~* 'it') {
		set $language_suffix 'it';
	}

	location /it/ {
		alias /var/www/lpda2/it/;
		try_files $uri $uri/ /it/index.html;
	}

	location /en/ {
		alias /var/www/lpda2/en/;
		try_files $uri $uri/ /en/index.html;
	}
}
```
