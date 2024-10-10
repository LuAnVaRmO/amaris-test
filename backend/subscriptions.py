import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
usuarios_table = dynamodb.Table('Clients')
subscriptions_table = dynamodb.Table('Subscriptions')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj)
    raise TypeError

def lambda_handler(event, context):
    if 'queryStringParameters' in event and event['queryStringParameters'] and 'user_id' in event['queryStringParameters']:
        user_id = event['queryStringParameters']['user_id']
    else:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "user_id is missing in query parameters"})
        }

    try:
        response = subscriptions_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
        )
        
        subscriptions = response.get('Items', [])
        usuario = usuarios_table.get_item(Key={'user_id': user_id})
        response = {
            "name":usuario['Item']['nombre'],
            "saldo":usuario['Item']['saldo'],
            "phone":usuario['Item']['phone'],
            "email":usuario['Item']['email'],
            "subscriptions": subscriptions
        }
        return {
            "statusCode": 200,
            "headers": {
            "Access-Control-Allow-Origin": "*", 
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
            "body": json.dumps(response, default=decimal_default)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Error querying subscriptions", "error": str(e)})
        }
