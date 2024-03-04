// swagger_operations/front.swagger.js


/**
 * @swagger
 * /front/product/reviews/{id}:
 *   get:
 *     summary: Get Reviews By Product Id
 *     tags: [Front]
 *     description: Get Reviews By Product Id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Reviews By Product Id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/rating-count/{id}:
 *   get:
 *     summary: Get Rating Count By Product Id
 *     tags: [Front]
 *     description: Get Rating Count By Product Id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Rating Count By Product Id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/similar-products/{id}:
 *   get:
 *     summary: Get Similar Products of a product
 *     tags: [Front]
 *     description: Get Similar Products of a product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Similar Products of a product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/popular-brands:
 *   get:
 *     summary: Get Popular Brands List (homepage)
 *     tags: [Front]
 *     description: Get Popular Brands List (homepage)
 *     responses:
 *       200:
 *         description: Get Popular Brands List (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/trending:
 *   get:
 *     summary: Get Trending Products List (homepage)
 *     tags: [Front]
 *     description: Get Trending Products List (homepage)
 *     responses:
 *       200:
 *         description: Get Trending Products List (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/recent-search:
 *   get:
 *     summary: Get Recent Search Products List (homepage)
 *     tags: [Front]
 *     description: Get Recent Search Products List (homepage)
 *     responses:
 *       200:
 *         description: Get Recent Search Products List (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/today-deals:
 *   get:
 *     summary: Get Today Deals List (homepage)
 *     tags: [Front]
 *     description: Get Today Deals List (homepage)
 *     responses:
 *       200:
 *         description: Today Deals List (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/banner-images/{page}:
 *   get:
 *     summary: Get Banner Images by page name
 *     tags: [Front]
 *     description: Get Banner Images by page name
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         description: page name e.g. home
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Banner Images by page name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:page', function(req, res) {
    //...
});

/**
 * @swagger
 * /front/product/categories/menu:
 *   get:
 *     summary: Get Category List with Sub categories for menu (homepage)
 *     tags: [Front]
 *     description: Get Category List with Sub categories for menu (homepage)
 *     responses:
 *       200:
 *         description: Get Category List with Sub categories for menu (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});

/**
 * @swagger
 * /front/product/categories/search:
 *   get:
 *     summary: Get Category List for Search (homepage)
 *     tags: [Front]
 *     description: Get Category List for Search (homepage)
 *     responses:
 *       200:
 *         description: Get Category List for Search (homepage)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/listing/categories/{id}:
 *   get:
 *     summary: Get Category List Product listing page.
 *     tags: [Front]
 *     description: Get Category List Product listing page.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category Id 
 *     responses:
 *       200:
 *         description: Get Category List Product listing page.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});



/**
 * @swagger
 * /front/product/detail/{id}:
 *   get:
 *     summary: Get Product Detail by Id.
 *     tags: [Front]
 *     description: Get Product Detail by Id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product Id 
 *     responses:
 *       200:
 *         description: Get Product Detail by Id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/reviews/{id}:
 *   get:
 *     summary: Get Product Reviews List by Id.
 *     tags: [Front]
 *     description: Get Product Reviews List by Id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product Id 
 *     responses:
 *       200:
 *         description: Get Product Reviews List by Id.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});


/**
 * @swagger
 * /front/product/listing:
 *   post:
 *     summary: Product listing with filters, sorting options and others.
 *     tags: [Front]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               search_value:
 *                 type: string
 *                 description: search value
 *                 example: shoes
 *               category_filter:
 *                 type: string
 *                 description: array of category ids
 *                 example: ["61322e7746a2a53570121b3c"]
 *               sub_category_filter:
 *                 type: string
 *                 description: array of sub category ids
 *                 example: [] 
 *               brand_filter:
 *                 type: string
 *                 description: array of brand ids
 *                 example: [] 
 *               color_filter:
 *                 type: string
 *                 description: array of color values
 *                 example: []
 *               price_filter:
 *                 type: string
 *                 description: min and max value of product price
 *                 example: {"min_val": 5,"max_val": 1000}
 *               sorting:
 *                 type: string
 *                 description: sorting type and sorting value
 *                 example: {"sort_type": "price","sort_val": "asc"} 
 *               count:
 *                 type: string
 *                 description: products limit
 *                 example: {"start": 0,"limit": 9}  
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/', function(req, res) {
    // ...
});



/**
 * @swagger
 * /front/product/listing/brands:
 *   post:
 *     summary: Product Brands by product ids.
 *     tags: [Front]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_ids:
 *                 type: string
 *                 description: array of product ids
 *                 example: ["6135b2de1f4b6c1bc429289d","61322ef646a2a53570121b55"]  
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.post('/', function(req, res) {
    // ...
});