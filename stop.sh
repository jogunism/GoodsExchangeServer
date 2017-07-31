#!/bin/sh
    
pid=`/bin/ps -fu $USER| grep "node" | grep -v "grep" | awk '{print $2}'`

echo
if [ $pid ]; then
    kill -9 "$pid"
    echo "\t* Service has stopped."
    echo "\t  Bye dude."
else
    echo "\t* Service is not running."
fi
echo
