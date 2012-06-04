#!/bin/bash

if [ $# -lt 1 ]
then
        echo "Usage : $0 {frenemy, frenemy-dev}"
        exit
fi

case "$1" in
frenemy-dev)
	mongo flame.mongohq.com:27067/app4708730 --username heroku --password efb8166e349154499df633abffc58d1e
	;;
frenemy)
	mongo staff.mongohq.com:10008/app4548898 --username heroku --password bbcb2391dbfbffc990367c91d087adeb
	;;
*)
	echo "Must specify a remote."
	;;
esac
