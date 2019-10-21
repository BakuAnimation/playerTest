#!/bin/bash
set -e

if [[ -z $1 ]]; then
  echo "USAGE: $0 images_path"
  exit 1
fi

dest_dir=./files/images/
img_list=./files/images_list.txt

rm -rf $dest_dir/
rm -f $img_list

#images=$(find $1 -type f | sort | head -n10)
images=$(find $1 -type f | sort)
for image in $images;
do
  echo "processing $image ..."

  uid=$(uuidgen)
  echo $uid >> $img_list

  mkdir -p $dest_dir/$uid
  original=$dest_dir/$uid/original.jpg
  medium=$dest_dir/$uid/medium.jpg
  tiny=$dest_dir/$uid/tiny.jpg
  timeline=$dest_dir/$uid/timeline.jpg

  cp $image $dest_dir/$uid/original.jpg
  convert -strip -interlace Plane -gaussian-blur 0.05 -quality 50% $original $medium
  convert -strip -interlace Plane -gaussian-blur 0.05 -quality 10% $original $tiny
  convert $medium -resize 256x256 $timeline

done
exit

# gestion d'images en mémoire en js avec { 
#   tiny: [ImageData]:max10000, 
#   medium: [ImageData]:max2000, 
#   original: [ImageData]:max1000, 
# }
# préchargement depuis l'image courante pour lecture
# gestion du download passive en cache

# make icon:
#   convert -resize x32 -gravity center -crop 32x32+0+0 -flatten -colors 256 images.jpeg output-32x32.ico
#   convert -resize x16 -gravity center -crop 16x16+0+0 -flatten -colors 256 images.jpeg output-16x16.ico
#   convert output-16x16.ico output-32x32.ico favicon.ico
#   scp favicon.ico perso:baku/server/files/favicon.ico
