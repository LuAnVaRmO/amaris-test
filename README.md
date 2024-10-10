# Luis Angel Vargas Mosquera Testing

## Preguntas:

1. De acuerdo con la anterior necesidad de negocio que tiene el área de servicio al cliente de la
compañía:
    - a. Indique con sus propias palabras, qué tecnologías utilizaría para garantizar la solución.
Justifique su respuesta.
    - b. Diseñe un modelo de datos NoSQL que permita la solución al problema.
    - c. Construya una aplicación web con API REST que permita al usuario disponer de la funcionalidad descrita. Considere manejo de excepciones, practicas limpias de desarrollo, pruebas unitarias y otros componentes que asegurenla calidad, seguridad y mantenibilidad. Para el desarrollo, considere algunas de las siguientes tecnologías: Python,React, DynamoDB, CloudFormation, Desarrollo orientado a objetos.
2. Escriba las consultas SQL correspondientes, para ello, tenga en cuenta la base de datos llamada “EL CLIENTE” la cual tiene las siguientes tablas (tenga en cuenta que se puede presentar el caso de que no todas las sucursales ofrecen los mismos productos). 
Obtener los nombres de los clientes los cuales tienen inscrito algún producto disponible sólo en las sucursales que visitan

## Respuestas:

1.
    - a. Para garantizar la soluciona a el problema y teniendo en cuenta la recomendaciones dadas, se utilizara Python junto con boto3 usando AWS Lambdas gatilladas por un API Gateway, asi garantizamos el serverless. Necesitaremos crear tablas de bases de datos usando DynamoDB que nos permite almacenar de forma efectiva la informacion requerida. Y se desarrolla una interfaz grafica  usando React para mantener una GUI sencilla pero reactiva, en un panel donde veremos los fondos disponibles, los fondos a los que estan vinculados y botones para vincularse y desvincularse de un fondo, y una vista donde tendremos el historial de transacciones organizado y con fecha de creacion de cada evento.

    - b. Se crean 3 modelos de tablas para DynamoDB:
    
    - Clientes:
        - user_id
        - nombre
        - email
        - phone
        - saldo

    - Transactions
        - user_id
        - transaction_id
        - amount
        - creation_date
        - funds_id
        - transaction_type

    - Subscriptions
        - subscription_id
        - user_id
        - funds_id
        - amount

    - c. Guia para despliegue:

        Necesitamos preparar primero el entorno donde tendremos nuestras funciones y el frontend, ademas de las tablas y los roles necesarios para ello.
        Al crear una funcion lambda esta automaticamente crea un rol para ello, pero debemos ingresar a IAM para configurar los roles getItem y putItem para permitir relacionarse con la base de datos.
        Configuramos las 3 tablas en DybnamoDB dejando como primary_key el user_id, y en caso de la subscripcion tambien el funds_id para poder filtrar correctamente al buscar los datos.

        En la carpeta de backend tenemos 3 archivos .py que serviran para crear 3 lambda function en AWS que luego seran gatilladas por una API Gateway que se enlaza con la funcion lambda, activando el proxy y habilitando CORS para poder recibir peticiones de cualquier fuente, esto por motivos de desarrollo, para produccion se debe configurar exactamente para recibir peticiones de una fuente, en este caso el frontend.

        El frontend de React se buildea y se sube a un bucket S3 habilitado para hostear un sitio estatico, donde nos da un link de acceso que luego es administrado por CloudFront.

        https://d1vmiduam0aa09.cloudfront.net

2. 
    SELECT DISTINCT client.nombre cliente.apellido FROM Cliente client
    JOIN Inscripción ins ON client.id = ins.idCliente
    JOIN Disponibilidad disp ON ins.idProducto = disp.idProducto
    JOIN Visitan visit ON client.id = visit.idCliente
    JOIN Sucursal suc ON visit.idSucursal = suc.id AND disp.idSucursal = suc.id;
