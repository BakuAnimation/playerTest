sudo apt-get install uuid-runtime e2fsprogs

./make.sh your_images_directory

docker-compose build
docker-compose up -d
