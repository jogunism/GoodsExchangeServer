#!/bin/sh

pid=`/bin/ps -fu $USER| grep "node" | grep -v "grep" | awk '{print $2}'`

echo
if [ $pid ]; then
    kill -9 "$pid"
    echo "\t* Service has restarted."
else
    echo "\t* Service start."
fi
echo

nohup node server.js 1>/dev/null 2>&1 & 
