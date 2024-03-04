// swagger_operations/user.swagger.js


/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User Login.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *                 example: user@gmail.com
 *               password:
 *                 type: string
 *                 description: The user's password.
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
 * /user/signup:
 *   post:
 *     summary: User Signup.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 description: The user's email
 *                 example: example@gmail.com
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: 123456
 *               purchase_type:
 *                 type: string
 *                 description: retail/wholesale
 *                 example: retail 
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
 * /user/change-password/{id}:
 *   put:
 *     security:
 *      - bearerAuth: [] 
 *     summary: User Change Password (Logged user)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user.
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
 *                 description: The user's old password(current password)
 *                 example: 123456 
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: 123456
 *               password_confirmation:
 *                 type: string
 *                 description: The user's confirm password
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
 * /user/forgot-password:
 *   post:
 *     summary: User Forgot Password(Verification link send to email)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
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
 * /user/reset-password/{id}:
 *   put:
 *     summary: User Reset Password (After click on verification link)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user.
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
 *                 description: The user's new password
 *                 example: 123456
 *               password_confirmation:
 *                 type: string
 *                 description: The user's confirm password
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
 * /user/products:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve a list of products (User)
 *     tags: [User]
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
 * /user/my-profile/{id}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Retrieve my profile detail (Logged user)
 *     tags: [User]
 *     description: Retrieve my profile detail (User) by id.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get my profile data
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
 * /user/edit-profile/{id}:
 *   put:
 *     security:
 *      - bearerAuth: [] 
 *     summary: Edit Profile (Logged user)
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name
 *                 example: 123456 
 *               email:
 *                 type: string
 *                 description: The user's email
 *                 example: user@gmail.com
 *               role:
 *                 type: string
 *                 description: User role(user/buyer)
 *                 example: user
 *               purchase_type:
 *                 type: string
 *                 description: Purchase type(retail/wholesale)
 *                 example: retail 
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
 * /user/wishlist/{id}:
 *   get:
 *     security:
 *      - bearerAuth: []  
 *     summary: Get Products of My Wishlist
 *     tags: [User]
 *     description: Get Products of My Wishlist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Products of My Wishlist
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
 * /user/my-coupons/{id}:
 *   get:
 *     security:
 *      - bearerAuth: []  
 *     summary: Get My Coupons
 *     tags: [User]
 *     description: Get My Coupons
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get My Coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

router.get('/:id', function(req, res) {
    //...
});