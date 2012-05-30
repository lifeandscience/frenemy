#!/bin/bash

if [ $# -lt 1 ]
then
        echo "Usage : $0 {frenemy-dev frenemy}"
        exit
fi

case "$1" in
frenemy-dev)
	mongodump --host flame.mongohq.com --port 27067 --username heroku --password efb8166e349154499df633abffc58d1e --db app4708730 --out mongo.frenemy-dev
	;;
frenemy)
	mongodump --host staff.mongohq.com --port 10008 --username heroku --password bbcb2391dbfbffc990367c91d087adeb --db app4548898 --out mongo.frenemy
	;;
*)
	echo "Must specify a remote."
	;;
esac
