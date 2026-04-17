
const responseHandler = (req, res, next) => {
    res.success = (data, message = 'Success', statusCode = 200) => {
        res.status(statusCode).json({
            status: 'Success!',
            message,
            data:[data],
        });
    };

    res.error = (message = 'Something went wrong', statusCode = 500) => {
        res.status(statusCode).json({
            status: 'Error!',
            message,
        });
    };

    res.notFound = (data, message = 'Not Found', statusCode = 200) => {
        res.status(statusCode).json({
            status: 'Success!',
            message,
            data:[data]
        })
    }

    res.validationError = (errors) => {
        res.status(422).json({
            status: 'Error!',
            message: 'Validation errors occurred',
            errors:[errors],
        });
    };

    res.customSuccess = (responseObject, statusCode = 200) => {
        res.status(statusCode).json(responseObject);
    };


    next();
};

export default responseHandler;
