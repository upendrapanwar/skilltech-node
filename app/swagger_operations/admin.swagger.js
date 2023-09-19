// swagger_operations/admin.swagger.js


/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin Login.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The admin's email.
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 description: The admin's password.
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
 * /admin/signup:
 *   post:
 *     summary: Admin Signup.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The admin's full name
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 description: The admin's phone no.
 *                 example: 9809801234 
 *               email:
 *                 type: string
 *                 description: The admin's email
 *                 example: example@gmail.com
 *               password:
 *                 type: string
 *                 description: The admin's password
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
 * /admin/users:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Users List
 *     tags: [Admin]
 *     description: Retrieve a list of users(customers) from Database (Admin Mode).
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
 * /admin/sellers:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Sellers List
 *     tags: [Admin]
 *     description: Retrieve a list of sellers(vendors) from Database (Admin Mode).
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
 * /admin/coupons/new:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: New Coupons List
 *     tags: [Admin]
 *     description: Retrieve a list of new coupons(discount codes) from Database (Admin Mode).
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
 * /admin/coupons/expired:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Expired Coupons List
 *     tags: [Admin]
 *     description: Retrieve a list of expired coupons(discount codes) from Database (Admin Mode).
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
 * /admin/coupons:
 *   post:
 *     security:
 *      - bearerAuth: [] 
 *     summary: Coupon Add
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coupon_code:
 *                 type: string
 *                 description: Coupon code
 *                 example: AB123454
 *               discount_percentage:
 *                 type: number
 *                 description: Discount %
 *                 example: 5 
 *               start_date:
 *                 type: string
 *                 description: Coupon code start date (Y-m-d format)
 *                 example: 2021-08-19 
 *               end_date:
 *                 type: string
 *                 description: Coupon code end date (Y-m-d format)
 *                 example: 2021-08-25
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