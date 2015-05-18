'use strict';

/**
 * Module dependencies
 */
var config     = require('./config'),
    async      = require('async'),
    _          = require('lodash'),
    ShopifyAPI = require('shopify-node-promise');

/**
 * Setup the API with the domain and token
 * this instance is now ready for this domain
 */
var api = new ShopifyAPI(config.shopDomain, config.token);

/**
 * Get all products and push into array
 */
 api.get('/admin/products.json')
     .then(function(res) {

        if (res.statusCode != 200) {
            console.log('Error Code', res.statusCode);
            process.exit(1);
        }

        /**
         * Iterate through product list
         */
        res.data.products.forEach(function(product) {

            // non product values
            if (!product.id) {
                return;
            }

            // allowed size values
            var allowed = ['XS', 'S', 'M', 'L', 'XL'];

            // convert existing product tag values to array
            var existing = product.tags.split(', ');

            // compare arrays to avoid duplicate entries into tags string
            allowed.forEach(function(tag) {

                if (_.indexOf(existing, tag) > -1) {
                    console.log('Skipping migration for product id', product.id);
                    return;
                }
            });

            /**
             * Use async waterfall to itereate through products and perform actions
             */
            async.waterfall([
                /**
                 * Get specific product metafields
                 */
                function(callback){

                    api.get('/admin/products/' + product.id + '/metafields.json')
                        .then(function(res) {

                            if (res.statusCode != 200) {
                                return callback(res.statusCode);
                            }

                            callback(null, res.data.metafields);

                    }, function(err) {
                        console.log(err);
                    });

                },
                /**
                 * Check for estimated size metafield and update tags
                 */
                function(metafields, callback) {

                    metafields.forEach(function(metafield) {

                        if (metafield.key == 'item-estimatedsize') {

                            if (_.indexOf(allowed, metafield.value) > -1) {

                                var tags = (product.tags.length > 0) ?
                                    product.tags + ', ' + metafield.value : metafield.value;

                                console.log('Updating product with tag(s)', tags);

                                // api.put('/admin/products/' + product.id + '.json', {
                                //     id: product.id,
                                //     tags: tags
                                // }).then(function(res) {
                                //
                                //         if (res.statusCode != 200) {
                                //             return callback(res.statusCode);
                                //         }
                                //
                                //         callback(null);
                                //
                                // }, function(err) {
                                //     console.log(err);
                                // });

                                // sample run! remove this line and callback below.
                                // also uncomment API call above.
                                callback(null);

                            }

                        }

                    });

                }
            ], function(err, res) {

                if (err) {
                    console.log('An error occurred while migrating product id', product.id);
                }

                console.log('Migration complete for product id', product.id);

            });

        });

 }, function(err) {
     console.log(err);
     process.exit(1);
 });
