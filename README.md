# Scaling Mongodb by using sharding

## Step 1: Deploy a config server replica set

### 1. Create a docker compose file to run the config servers

```
touch docker-compose.yml
```

```yaml
version: "3"
services:
  configs1:
    container_name: configs1
    image: mongo
    command: mongod --configsvr --replSet cfgrs --port 27017 --dbpath /data/db
    ports:
      - 10001:27017
    volumes:
      - configs1:/data/db
  configs2:
    container_name: configs2
    image: mongo
    command: mongod --configsvr --replSet cfgrs --port 27017 --dbpath /data/db
    ports:
      - 10002:27017
    volumes:
      - configs2:/data/db
  configs3:
    container_name: configs3
    image: mongo
    command: mongod --configsvr --replSet cfgrs --port 27017 --dbpath /data/db
    ports:
      - 10003:27017
    volumes:
      - configs3:/data/db
volumes:
  configs1: {}
  configs2: {}
  configs3: {}
```

### 2. Run the config servers by running the docker-compose file

```
docker-compose up -d
```

### 3. Use the mongo client application to Lon in to one of the config servers

- First you need to find the IP address of your local machine, when you run the command check the `en1` or the `eth` lines to get the IP

  ```
  ifconfig
  ```

- Then log to one of the config servers by using the IP address of your local machine

  ```
  mongo --host 192.168.8.14 --port 10001
  ```

- Then you will get in to the mongo client and you can now run mongo db related commands by using the mongo client

### 3. Intiate the replicas in MongoDB by using the `rs.initiate()` method

- Run this command inside the mongodb shell

  ```
  rs.initiate(
    {
      _id: "cfgrs",
      configsvr: true,
      members: [
        { _id : 0, host : "[ip-address]:[port]" },
        { _id : 1, host : "[ip-address]:[port]" },
        { _id : 2, host : "[ip-address]:[port]" }
      ]
    }
  )
  ```

- After running this above command you will get a result in the mongodb shell and if the result is successful the "ok" key will be 1 or for error 0, make sure the output is like this

  ```
  {
  	"ok" : 1,
  	"$gleStats" : {
  		"lastOpTime" : Timestamp(1685622472, 1),
  		"electionId" : ObjectId("000000000000000000000000")
  	},
  	"lastCommittedOpTime" : Timestamp(1685622472, 1),
  	"$clusterTime" : {
  		"clusterTime" : Timestamp(1685622472, 1),
  		"signature" : {
  			"hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
  			"keyId" : NumberLong(0)
  		}
  	},
  	"operationTime" : Timestamp(1685622472, 1)
  }
  ```

- Press Enter to exit the secondary and return to the primary instance

- Use the `rs.status()` method to check the status of your instances

  ```
  rs.status()
  ```

## Step 2: Create a shard replica set

- After setting up a config server replica set, create shards that will contain your data. The example below shows how to create and initiate only one shard replica set, but the process for each subsent shard is the same

### 1. Create and navigate to the directory where you will store shard-related manifests

```
md shard && cd shard
```

### 2. Create a docker-compose file

```
touch docker-compose.yml
```

### 3. Configure shard instances

- Below is an example of a docker-compose file that defineds three shard replica sets and three permanent storage volumes

  ```yaml
  version: "3"
  services:
    shard1s1:
      container_name: shard1s1
      image: mongo
      command: mongod --shardsvr --replSet shard1rs --port 27017 --dbpath /data/db
      ports:
        - 20001:27017
      volumes:
        - shard1s1:/data/db
    shard1s2:
      container_name: shard1s2
      image: mongo
      command: mongod --shardsvr --replSet shard1rs --port 27017 --dbpath /data/db
      ports:
        - 50002:27017
      volumes:
        - shard1s2:/data/db
    shard1s3:
      container_name: shard1s3
      image: mongo
      command: mongod --shardsvr --replSet shard1rs --port 27017 --dbpath /data/db
      ports:
        - 50003:27017
      volumes:
        - shard1s3:/data/db
  volumes:
    shard1s1: {}
    shard1s2: {}
    shard1s3: {}
  ```

- Run the docker compose file

  ```
  docker-compose up -d
  ```

### 4. Login to one of the replicas using the mongo command

```
mongo mongodb://<ip_of_your machine>:<port_of_the_shard
```

Find the ip of your machine by using `ifconfig` and port of the shard container by running `docker ps`

### 5. Initiate the replica set with rs.initiate()

- After you get into the mongo shell, now you have the ip of your machine and you can find each of the shard servers port from docker ps and now run this command

  ```
  rs.initiate(
    {
      _id: "shard1rs",
      members: [
        { _id : 0, host : "10.0.2.15:20001" },
        { _id : 1, host : "10.0.2.15:20002" },
        { _id : 2, host : "10.0.2.15:20003" }
      ]
    }
  )
  ```

- If the output is "ok": 1, then you are good to go

## Step 3: Run the query router container or Mongos instance

- A Mongos instance acts as a query router, an interface between the cluster and client apps. Follow the following steps below to set it up in your cluster.

### 1. Create a directory for the mongos instance and create a docker-compose file

```
md mongos && cd mongos
```

```
touch docker-compose.yml
```

### 2. Add code to the docker-compose file

- The file below creates a mongos instance and exposes it to port 30000. The command section should contain the `--configdb` option followed by references to the address of config server replicas

- NOTE: you need to add the config servers address in the docker-compose file replace the `10.0.2.15:10001` and other address with your own config servers address

  ```yaml
  version: "3"
  services:
    mongos:
      container_name: mongos
      image: mongo
      command: mongos --configdb cfgrs/10.0.2.15:10001,10.0.2.15:10002,10.0.2.15:10003 --bind_ip 0.0.0.0 --port 27017
      ports:
        - 30000:27017
  ```

- Run the docker-compose file

  ```
  docker-compose up -d
  ```

- Check if the container for mongos is running

  ```
  docker ps
  ```

## Step 4: Connect to the sharded cluster

- With all the instances up and running, the rest of the cluster configuration takes place inside the cluster. connect ot the cluster using the `mongo` command

  ```
  mongo mongodb://[mongos-ip-address]:[mongos-port]
  ```

- If everything is good you will get an output like this

  ```
  MongoDB shell version v5.0.17
  connecting to: mongodb://192.168.8.14:30000/?compressors=disabled&gssapiServiceName=mongodb
  Implicit session: session { "id" : UUID("61a8c5b2-2fc3-4302-869d-7ca025d11fb6") }
  MongoDB server version: 5.0.9
  ================
  Warning: the "mongo" shell has been superseded by "mongosh",
  which delivers improved usability and compatibility.The "mongo" shell has been deprecated and will be removed in
  an upcoming release.
  For installation instructions, see
  https://docs.mongodb.com/mongodb-shell/install/
  ================
  ---
  The server generated these startup warnings when booting:
          2023-06-01T12:54:54.843+00:00: Access control is not enabled for the database. Read and write access to data and configuration is unrestricted
  ---
  mongos>
  ```

## Step 5: Add shards to the cluster

- From step 4 we are in the mongos shell and now Use the `sh.addshard()` command and connect the shard replicas to the cluster

  ```
  sh.addShard("[shard-replica-set-name]/[shard-replica-1-ip]:[port],[shard-replica-2-ip]:[port],[shard-replica-3-ip]:[port]")
  ```

- Replace the shard-replica-ip and port value it should be something like this

  ```
  sh.addShard("shard1rs/192.168.8.14:20001,192.168.8.14:50002,192.168.8.14:50003")
  ```

- Run `sh.status()` if the above command returns a value "ok": 1 and when you run `sh.status()` you should see the shard servers added to the cluster like this

  ```
  --- Sharding Status ---
    sharding version: {
    	"_id" : 1,
    	"minCompatibleVersion" : 5,
    	"currentVersion" : 6,
    	"clusterId" : ObjectId("64788ed48d49d612423c9cef")
    }
    shards:
          {  "_id" : "shard1rs",  "host" : "shard1rs/192.168.8.14:20001,192.168.8.14:50002,192.168.8.14:50003",  "state" : 1,  "topologyTime" : Timestamp(1685624561, 1) }
    active mongoses:
          "5.0.9" : 1
    autosplit:
          Currently enabled: yes
    balancer:
          Currently enabled: yes
          Currently running: no
          Failed balancer rounds in last 5 attempts: 0
          Migration results for the last 24 hours:
                  No recent migrations
    databases:
          {  "_id" : "config",  "primary" : "config",  "partitioned" : true }
  mongos>

  ```

## Step 6: Enable sharding for a Database

- Enable sharding for each database you plan to use it on, use the `sh.enableSharding()` method, followed by the database name

  ```
  sh.enableSharding("[database-name")
  ```

- You should see this output

  ```
  {
  	"ok" : 1,
  	"$clusterTime" : {
  		"clusterTime" : Timestamp(1685625350, 4),
  		"signature" : {
  			"hash" : BinData(0,"AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
  			"keyId" : NumberLong(0)
  		}
  	},
  	"operationTime" : Timestamp(1685625350, 3)
  }

  ```

- As you see just because you are adding all this configuration cluster it doesn't mean you need to use sharding in all of your databases, you can use it only for a specific database

### Step 7: Shard a collection

- Sharding a collection in Mongodb is primarily done to horizontally sclae the database and handle large abounts of data, when a collection grows beyond the capacity of a single Mongodb server, sharding allows the collection to be distributed across multiple servers or shards.

- There are two ways to shard a collectin in Mongodb.

  1. **Range-based sharding**: Produces a shard key using multiple fields and creates a contiguous data ranges based on the shard key values.

     - To shard a collection by using a range based sharding, specify the field to use as a shard key and set its value to 1

       ```
       sh.shardCollection("[database_name].[collection_name]", { [field]: 1 } )
       ```

  2. **Hashed sharding**: Forms a shard key using a single fields hashed index

     - to shard a collection by using this method, set the value of the field to **hashed**

       ```
       sh.shardCollection("[database_name].[collection_name]", { [field]: "hashed" } )
       ```

### Step 7: Access your DB from your client of your choice, like mongodb compass

- NOTE, when you try to connect via mongodb compass, you should use the address of the mongos router, first run `docker ps` and check the port of mongos

  ```
  mongodb://localhost:30000
  ```

### Step 8: Prepare bulk data and and write it to your new db and check the performance
* Run the `dataGenerator` script and it will generate 100k data and write this data to your mongodb database.# Mongodb-sharding-docker
