FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./sites-available /etc/nginx/sites-available

COPY ./letsencrypt/live/shrillecho.app/fullchain1.pem /etc/letsencrypt/live/shrillecho.app/fullchain.pem
COPY ./letsencrypt/live/shrillecho.app/privkey1.pem /etc/letsencrypt/live/shrillecho.app/privkey.pem

RUN mkdir -p /etc/nginx/sites-enabled

RUN ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/app.conf 
EXPOSE 443