# Description of the project 


**How to get started**

**1. Set up the database**
Run this command to create tables and structure:
```sh
npm run setup-dbs

**2. Run this command to fill the database with test data
for development:**
```sh
 npm run seed-dev
 ```

 **for test environment:**
 ```sh
 npm run seed-test
 ```

 **3. You need to put the database credentials in a `.env` file at the top level of this project.**
```
PGDATABASE=airbnc_test
```
**4. Once the database is ready, run your tests:**
```sh
npm test
