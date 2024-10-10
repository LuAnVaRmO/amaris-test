import boto3
import json
from datetime import datetime
import uuid

dynamodb = boto3.resource('dynamodb')
SNS_client = boto3.client('sns', region_name='us-west-2')

user_db = dynamodb.Table('Clients')
transactions_db = dynamodb.Table('Transactions')
subscriptions_db = dynamodb.Table('Subscriptions')

fondos = [
    {"id": "1", "nombre": "CLIENTE_RECAUDADORA", "monto_minimo_vinculacion": 75000, "categoria": "FPV"},
    {"id": "2", "nombre": "FPV_EL_CLIENTE_ECOPETROL", "monto_minimo_vinculacion": 125000, "categoria": "FPV"},
    {"id": "3", "nombre": "DEUDA_PRIVADA", "monto_minimo_vinculacion": 50000, "categoria": "FIC"},
    {"id": "4", "nombre": "FDO_ACCIONES", "monto_minimo_vinculacion": 250000, "categoria": "FIC"},
    {"id": "5", "nombre": "FPV_EL_CLIENTE_DINAMICA", "monto_minimo_vinculacion": 100000, "categoria": "FPV"}
]

def lambda_handler(event, context):
    user_id = str(event['user_id'])
    funds_id = str(event['funds_id'])
    transaction_type = event['transaction_type']
    amount = int(event.get('amount', 0))
    notification = event['notification']
    message = ""
    
    usuario = user_db.get_item(Key={'user_id': user_id})
    saldo_actual = usuario['Item']['saldo']
    phone_number = usuario['Item']['phone']
    email = usuario['Item']['email']
    
    fondo = next((f for f in fondos if f['id'] == funds_id), None)
    
    if not fondo:
        return {"statusCode": 404, "body": "Fondo no encontrado"}

    if transaction_type == "Vinculacion":
        if saldo_actual < fondo['monto_minimo_vinculacion']:
            return {
                "statusCode": 400, 
                "headers": {
                    "Content-Type": "application/json"  
                },
                "body": json.dumps({
                    "message": f"No tiene saldo disponible para vincularse al fondo {fondo['nombre']}"
                })
            }
        elif fondo['monto_minimo_vinculacion'] > amount:
            return {
                "statusCode": 400,
                "body": f"Monto minimo para vincularse al fondo {fondo['monto_minimo_vinculacion']}"
            }
        
        suscripcion = subscriptions_db.get_item(Key={'user_id': user_id, 'funds_id': funds_id})
        
        if 'Item' in suscripcion:
            nuevo_saldo = saldo_actual + suscripcion['Item']['amount'] - amount
        else:
            nuevo_saldo = saldo_actual - amount
            
        user_db.update_item(
            Key={'user_id': user_id},
            UpdateExpression="set saldo = :nuevo_saldo",
            ExpressionAttributeValues={':nuevo_saldo': nuevo_saldo}
        )
        
        subscriptions_db.put_item(
            Item={
                'subscription_id': str(uuid.uuid4()),
                'user_id': user_id,
                'funds_id': funds_id,
                'amount': amount
            }
        )

    elif transaction_type == "Desvinculacion":
        suscripcion = subscriptions_db.get_item(Key={'user_id': user_id, 'funds_id': funds_id})
        if 'Item' not in suscripcion:
            return {
                "statusCode": 400,
                "body": f"No está suscrito al fondo {fondo['nombre']}"
            }
        amount = suscripcion['Item']['amount']
        nuevo_saldo = saldo_actual + amount
        user_db.update_item(
            Key={'user_id': user_id},
            UpdateExpression="set saldo = :nuevo_saldo",
            ExpressionAttributeValues={':nuevo_saldo': nuevo_saldo}
        )
        
        subscriptions_db.delete_item(Key={'user_id': user_id, 'funds_id': funds_id})

    else:
        return {"statusCode": 400, "body": "Tipo de transacción no válido"}

    transaccion_id = str(uuid.uuid4())
    transactions_db.put_item(
        Item={
            'transaction_id': transaccion_id,
            'user_id': user_id,
            'funds_id': funds_id,
            'transaction_type': transaction_type,
            'amount': amount,
            'creation_date': str(datetime.now())
        }
    )
    
    message = f"Transaccion: {transaction_type} realizada con exito"
    send_notification(notification, message, phone = phone_number, mail = email)

    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        "body": f"Transacción {transaction_type} realizada con éxito"
    }


def send_notification(notification, message, phone=None, mail=None):
    if notification == "1":  # SMS
        if phone is None:
            print("Número de teléfono no proporcionado")
            return
        try:
            response = SNS_client.publish(
                PhoneNumber=phone,
                Message=message
            )
            print(f"SMS enviado correctamente a {phone}. Response: {response}")
        except Exception as e:
            print(f"Error enviando SMS: {str(e)}")
        
    elif notification == "2":  # mail
        if mail is None:
            print("Correo electrónico no proporcionado")
            return

        try:
            response = SNS_client.publish(
                TopicArn='arn:aws:sns:us-west-2:993269447373:notifications',
                Message=message,
                Subject="Notificacion por correo"
            )
            print(f"Correo enviado correctamente a {mail}. Response: {response}")
        except Exception as e:
            print(f"Error enviando correo: {str(e)}")
    else:
        print("Tipo de notificación no reconocido")