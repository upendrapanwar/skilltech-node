// swagger_operations/seller.swagger.js


/**
 * @swagger
 * /seller/login:
 *   post:
 *     summary: Seller Login.
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The seller's email.
 *                 example: seller@gmail.com
 *               password:
 *                 type: string
 *                 description: The seller's password.
 *                 example: 123456 
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
 * /seller/signup:
 *   post: 
 *     summary: Seller Signup.
 *     tags: [Seller] 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The seller's full name
 *                 example: Steve Clark
 *               email:
 *                 type: string
 *                 description: The seller's email
 *                 example: seller@gmail.com
 *               password:
 *                 type: string
 *                 description: The seller's password
 *                 example: 123456
 *               password_confirmation:
 *                 type: string
 *                 description: The seller's confirm password
 *                 example: 123456 
 *               country:
 *                 type: string
 *                 description: The seller's country
 *                 example: US
 *               state:
 *                 type: string
 *                 description: The seller's state
 *                 example: NY
 *               address:
 *                 type: string
 *                 description: The seller's address
 *                 example: A street B town 
 *               seller_type:
 *                 type: string
 *                 description: retailer/wholeseller
 *                 example: retailer
 *               want_to_sell:
 *                 type: string
 *                 description: wholeseller/retailer
 *                 example: wholeseller 
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
 * /seller/change-password/{id}:
 *   put:
 *     security:
 *      - bearerAuth: [] 
 *     summary: Seller Change Password (Logged seller)
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the seller.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               old_password:
 *                 type: string
 *                 description: The seller's old password(current password)
 *                 example: 123456 
 *               password:
 *                 type: string
 *                 description: The seller's password
 *                 example: 123456
 *               password_confirmation:
 *                 type: string
 *                 description: The seller's confirm password
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id', function(req, res) {
    // ...
});

/**
 * @swagger
 * /seller/forgot-password:
 *   post:
 *     summary: Seller Forgot Password(Verification link send to email)
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The seller's email
 *                 example: example@gmail.com 
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
 * /seller/reset-password/{id}:
 *   put:
 *     summary: Seller Reset Password (After click on verification link)
 *     tags: [Seller]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the seller.
 *         schema:
 *           type: string 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: verification link hash code
 *                 example: jgpp7wkp7ka46hyz7bkxt 
 *               password:
 *                 type: string
 *                 description: The seller's new password
 *                 example: 123456
 *               password_confirmation:
 *                 type: string
 *                 description: The seller's confirm password
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id', function(req, res) {
    // ...
});



/**
 * @swagger
 * /seller/products:
 *   post: 
 *     summary: Add Product.
 *     tags: [Seller] 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               seller_id:
 *                 type: string
 *                 description: The seller's ID
 *                 example: 611e2430ef08c530d094a3aa 
 *               name:
 *                 type: string
 *                 description: The product's name
 *                 example: Test Product
 *               category:
 *                 type: string
 *                 description: The category ID
 *                 example: 60506108c1115c20a82aa721 
 *               sub_category:
 *                 type: string
 *                 description: The sub category ID
 *                 example: 604b2f47c4078f012ca4a2f1 
 *               brand:
 *                 type: string
 *                 description: The brand ID
 *                 example: 604b2f47c4078f012ca4a2f1  
 *               description:
 *                 type: string
 *                 description: Product's description
 *                 example: lorem ipsum jipsum pipusum
 *               specifications:
 *                 type: string
 *                 description: Product's specifications
 *                 example: lorem ipsum jipsum pipusum 
 *               price:
 *                 type: string
 *                 description: Product's price
 *                 example: 50  
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
 * /seller/products/{id}:
 *   put: 
 *     summary: Edit Product.
 *     tags: [Seller] 
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product.
 *         schema:
 *           type: string 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               seller_id:
 *                 type: string
 *                 description: The seller's ID
 *                 example: 611e2430ef08c530d094a3aa 
 *               name:
 *                 type: string
 *                 description: The product's name
 *                 example: Test Product
 *               category:
 *                 type: string
 *                 description: The category ID
 *                 example: 60506108c1115c20a82aa721 
 *               sub_category:
 *                 type: string
 *                 description: The sub category ID
 *                 example: 604b2f47c4078f012ca4a2f1 
 *               brand:
 *                 type: string
 *                 description: The brand ID
 *                 example: 604b2f47c4078f012ca4a2f1  
 *               description:
 *                 type: string
 *                 description: Product's description
 *                 example: lorem ipsum jipsum pipusum
 *               specifications:
 *                 type: string
 *                 description: Product's specifications
 *                 example: lorem ipsum jipsum pipusum 
 *               price:
 *                 type: string
 *                 description: Product's price
 *                 example: 50  
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id', function(req, res) {
    // ...
});


/**
 * @swagger
 * /seller/products:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve a list of products (Seller)
 *     tags: [Seller]
 *     description: Retrieve a list of products from Database.
 *     responses:
 *       200:
 *         description: Test
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
 * /seller/services/{id}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve a single service detail (Seller)
 *     tags: [Seller]
 *     description: Retrieve a single service detail by id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the service to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get single service detail.
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
 * /seller/stock/added-products:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Stock Management - Retrieve a list of added products (Seller)
 *     tags: [Seller]
 *     description: Stock Management - Retrieve a list of added products from Database.
 *     responses:
 *       200:
 *         description: Test
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
 * /seller/stock/pending-products:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Stock Management - Retrieve a list of pending products (Seller)
 *     tags: [Seller]
 *     description: Stock Management - Retrieve a list of pending products from Database.
 *     responses:
 *       200:
 *         description: Test
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
 * /seller/stock/rejected-products:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Stock Management - Retrieve a list of rejected products (Seller)
 *     tags: [Seller]
 *     description: Stock Management - Retrieve a list of rejected products from Database.
 *     responses:
 *       200:
 *         description: Test
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
 * /seller/services:
 *   post: 
 *     summary: Add Service.
 *     tags: [Seller] 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               seller_id:
 *                 type: string
 *                 description: The seller's ID
 *                 example: 611e2430ef08c530d094a3aa 
 *               name:
 *                 type: string
 *                 description: The service's name
 *                 example: Test Service
 *               category:
 *                 type: string
 *                 description: The category ID
 *                 example: 60506108c1115c20a82aa721 
 *               sub_category:
 *                 type: string
 *                 description: The sub category ID
 *                 example: 604b2f47c4078f012ca4a2f1 
 *               validity:
 *                 type: string
 *                 description: Validity(in days)
 *                 example: 10 days  
 *               description:
 *                 type: string
 *                 description: Service's description
 *                 example: lorem ipsum jipsum pipusum
 *               price:
 *                 type: string
 *                 description: Service's price
 *                 example: 50  
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
 * /seller/services/{id}:
 *   put: 
 *     summary: Edit Service.
 *     tags: [Seller] 
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the service.
 *         schema:
 *           type: string 
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               seller_id:
 *                 type: string
 *                 description: The seller's ID
 *                 example: 611e2430ef08c530d094a3aa 
 *               name:
 *                 type: string
 *                 description: The service's name
 *                 example: Test Service
 *               category:
 *                 type: string
 *                 description: The category ID
 *                 example: 60506108c1115c20a82aa721 
 *               sub_category:
 *                 type: string
 *                 description: The sub category ID
 *                 example: 604b2f47c4078f012ca4a2f1 
 *               validity:
 *                 type: string
 *                 description: Validity(in days)
 *                 example: 10 days  
 *               description:
 *                 type: string
 *                 description: Service's description
 *                 example: lorem ipsum jipsum pipusum
 *               price:
 *                 type: string
 *                 description: Service's price
 *                 example: 50  
 *     responses:
 *       200:
 *         description: Test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.put('/:id', function(req, res) {
    // ...
});

/**
 * @swagger
 * /seller/services:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve a list of services (Seller)
 *     tags: [Seller]
 *     description: Retrieve a list of services from Database.
 *     responses:
 *       200:
 *         description: Test
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
 * /seller/products/{id}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve a single product detail (Seller)
 *     tags: [Seller]
 *     description: Retrieve a single product detail by id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the product to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get single product detail.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});
