JPEG_QUALITY=95
IMAGES_IN=assets/raw_assets
IMAGES_OUT=assets/img


function fsize(){
  echo `stat --printf="%s" $1`
}

echo ""

BEFORE=0
AFTER=0
IMG_IN=`realpath $IMAGES_IN`
IMG_OUT=`realpath $IMAGES_OUT`

cd $IMG_IN

for file in *.png
do
  [ ! -f $file ] && continue
  colors=256
  let "BEFORE += $(fsize $file)"
  [ -f $file.conf ] && source $file.conf
  pngnq -n $colors < $file > $file.nq && optipng -quiet -strip all $file.nq && mv $file.nq $IMG_OUT/$file
  echo $file
  let "AFTER += $(fsize $IMG_OUT/$file)"
done

for file in *.jpg
do
  [ ! -f $file ] && continue
  quality=$JPEG_QUALITY
  let "BEFORE += $(fsize $file)"
  [ -f $file.conf ] && source $file.conf
  jpegoptim -q --max=$quality --overwrite --dest=$IMG_OUT $file
  echo $file
  let "AFTER += $(fsize $IMG_OUT/$file)"
done

cd ..

let "PERC=$AFTER*100/$BEFORE"

echo ""
echo "BEFORE: $BEFORE Bytes"
echo " AFTER: $AFTER Bytes ($PERC%)"
