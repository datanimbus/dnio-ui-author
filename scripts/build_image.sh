#!/bin/bash
set -e

if [ -f $WORKSPACE/../TOGGLE ]; then
    echo "****************************************************"
    echo "datanimbus.io.ui-author :: Toggle mode is on, terminating build"
    echo "datanimbus.io.ui-author :: BUILD CANCLED"
    echo "****************************************************"
    exit 0
fi

if [ -f $WORKSPACE/../DATA_STACK_RELEASE ]; then
    REL=`cat $WORKSPACE/../DATA_STACK_RELEASE`
fi

if [ $1 ]; then
    REL=$1
fi

if [ ! $REL ]; then
    echo "****************************************************"
    echo "datanimbus.io.ui-author :: Please Create file DATA_STACK_RELEASE with the releaese at $WORKSPACE or provide it as 1st argument of this script."
    echo "datanimbus.io.ui-author :: BUILD FAILED"
    echo "****************************************************"
    exit 0
fi

TAG=$REL

if [ $2 ]; then
    TAG=$TAG"-"$2
fi

echo "****************************************************"
echo "datanimbus.io.ui-author :: Building Image :: "$TAG
echo "****************************************************"
cd $WORKSPACE

# ng build --prod

docker build -t datanimbus.io.ui-author:$TAG .

echo $TAG > $WORKSPACE/../LATEST_AUTHOR