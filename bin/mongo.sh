#!/bin/bash

if [ $# -lt 2 ]
then
        echo "Usage : $0 {import, export, etc.} {dev-frenemy, frenemy}"
        exit
fi

APPID=app4708730
PORT=27067
HOST=flame.mongohq.com
PASSWORD=vpnZvHpxq3G5pXwHPsjrMqrzSGYpu3X9qYeMtIecqEPUg7KSopf32kZNaXwVUgAshuKEz32xxWnRY4RF9dPA8w
USERNAME=heroku

case "$2" in
frenemy)
	APPID=app4548898
	PORT=10008
	HOST=staff.mongohq.com
	USERNAME=heroku
	PASSWORD=mfik1FJC-snr8m-pglRXJjr0dKjIY0lv50-Z0ZR8xntmblftglVyc_o0qxNoA6eIQNV8uuwtM3uErAaN0eIL3w
	;;
dev-frenemy)
	echo "Dev is the default"
	;;
*)
	echo "Must specify a remote."
	exit 1
	;;
esac
	
	
case "$1" in
shell)
	mongo $HOST:$PORT/$APPID --username $USERNAME --password $PASSWORD
	;;
export)
	mongodump --host $HOST --port $PORT --username $USERNAME --password $PASSWORD --db $APPID --out bin/mongo.$2
	;;
import)
	echo "Importing from $2"
	DATE=`date "+%Y-%m-%d-%H-%M-%S"`
	OLD_NAME="dev_e_bluepane_com-$DATE"
	mongo dev_e_bluepane_com --eval "db.copyDatabase('dev_e_bluepane_com', '$OLD_NAME')"
	mongo dev_e_bluepane_com --eval "db.dropDatabase()"
	mongorestore --host localhost -d dev_e_bluepane_com "bin/mongo.$2/$APPID"
	;;
clear)
	echo "Clearing database..."
	DATE=`date "+%Y-%m-%d-%H-%M-%S"`
	OLD_NAME="dev_e_bluepane_com-$DATE"
	mongo dev_e_bluepane_com --eval "db.copyDatabase('dev_e_bluepane_com', '$OLD_NAME'); db.dropDatabase();"
	echo "Done."
	;;
esac
