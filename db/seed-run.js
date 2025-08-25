const seed = require("./seed");
const {propertyTypesData, 
    imagesData, 
    propertiesData,
    reviewsData,
    favouritesData,
    usersData,
bookingsData,
amenitiesData} = require ("./data");




seed (propertyTypesData,
usersData,
propertiesData,
reviewsData,
imagesData,
favouritesData,
bookingsData,
amenitiesData
);