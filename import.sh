#!/bin/bash

if [ $# -lt 1 ]
then
        echo "Usage : $0 {frenemy-dev frenemy}"
        exit
fi

DIR=""
DATE=`date "+%Y-%m-%d-%H-%M-%S"`
OLD_NAME="frenemy-$DATE"
case "$1" in
frenemy-dev)
	DIR="app4708730"
        ;;
frenemy)
	DIR="app4548898"
        ;;
*)
        echo "Must specify a remote."
        ;;
esac

echo "Importing from $1"
mongo frenemy --eval "db.copyDatabase('frenemy', '$OLD_NAME')"
mongo frenemy --eval "db.dropDatabase()"
mongorestore --host localhost -d frenemy "mongo.$1/$DIR"
