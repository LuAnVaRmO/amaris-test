import boto3
import json
from decimal import Decimal


dynamodb = boto3.resource('dynamodb')
usuarios_table = dynamodb.Table('Clients')
transacciones_table = dynamodb.Table('Transactions')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError
    
def lambda_handler(event, context):
    user_id = event['user_id']

    response = transacciones_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id)
    )

    transactions = response.get('Items', [])

    return {
        "statusCode": 200,
        "body": json.dumps(transactions, default=decimal_default)
    }