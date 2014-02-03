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
mls-frenemy)
	APPID=app4548898
	PORT=10008
	HOST=staff.mongohq.com
	USERNAME=heroku
	PASSWORD=mfik1FJC-snr8m-pglRXJjr0dKjIY0lv50-Z0ZR8xntmblftglVyc_o0qxNoA6eIQNV8uuwtM3uErAaN0eIL3w
	;;
mls-testing-frenemy)
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
importToLocal)
	echo "Importing from $2"
	DATE=`date "+%Y-%m-%d-%H-%M-%S"`
	OLD_NAME="experimonth-$DATE"
	mongo experimonth --eval "db.copyDatabase('experimonth', '$OLD_NAME')"
	# mongo experimonth --eval "db.collection.remove()"
	mongo experimonth --eval "var collectionNames = db.getCollectionNames(); for(var i = 0, len = collectionNames.length; i < len ; i++){ var collectionName = collectionNames[i]; if(collectionName.indexOf('system') == -1){ db[collectionName].drop(); } }"
	mongorestore --host localhost -d experimonth "bin/mongo.$2/$APPID"
	;;
importToRemote)
	echo "Importing into $2 from bin/mongo.$3/$4 in 15s..."
	echo "THIS WILL DESTROY ALL DATA ON $2!!!"
	sleep 15s
	echo "Removing all collections except user on $HOST:$PORT/$APPID in 5s"
	sleep 5s
	# mongo $HOST:$PORT/$APPID --username $USERNAME --password $PASSWORD --eval "db.collection.remove()"
	mongo $HOST:$PORT/$APPID --username $USERNAME --password $PASSWORD --eval "var collectionNames = db.getCollectionNames(); for(var i = 0, len = collectionNames.length; i < len ; i++){ var collectionName = collectionNames[i]; if(collectionName.indexOf('system') == -1){ db[collectionName].drop(); } }"

	echo "Executing mongorestore on $HOST:$PORT/$APPID from bin/mongo.$3/$4 in 5s"
	echo "mongorestore --drop --host $HOST --port $PORT -d $APPID -u $USERNAME -p $PASSWORD bin/mongo.$3/$4"
	sleep 5s
	mongorestore --drop --host $HOST --port $PORT -d $APPID -u $USERNAME -p $PASSWORD "bin/mongo.$3/$4"
	;;
clear)
	echo "Clearing database..."
	DATE=`date "+%Y-%m-%d-%H-%M-%S"`
	OLD_NAME="experimonth-$DATE"
	mongo experimonth --eval "db.copyDatabase('experimonth', '$OLD_NAME'); db.dropDatabase();"
	echo "Done."
	;;
esac
