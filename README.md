# Shinesty Migration

The purpose of this script is to migrate size values (e.g. XS, S, M, L, XL) from the metafields value to the tag string. The script makes an API call to products to retrieve product metafields. It then iterates through the products and appends the size value to the tag string (comma separated).
