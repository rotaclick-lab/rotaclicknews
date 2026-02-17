# Pricing Analyze - Request/Response Examples

## Endpoint

`POST /api/pricing/analyze`

## Request example

```json
{
  "carrier_id": "11111111-1111-1111-1111-111111111111",
  "vehicle_type_id": "22222222-2222-2222-2222-222222222222",
  "origem": { "cep": "01000-000" },
  "destino": { "cep": "20000-000" },
  "km_estimado": 500,
  "horas_estimadas": 6,
  "pedagio_estimado": 120,
  "modelo_de_preco": "CEP_RANGE",
  "price_input": 3200,
  "vale_pedagio_included": true,
  "antt_operation_code": "default",
  "custom_axles": 3
}
```

## Success response example

```json
{
  "success": true,
  "total_cost": 2450.7,
  "breakdown": {
    "fuel": 1000,
    "variable": 600,
    "fixed_alloc": 600,
    "tolls": 120,
    "time_cost": 270,
    "fees": 89,
    "empty_return": 171.7
  },
  "profit_value": 749.3,
  "margin_percent": 23.42,
  "classification": "GREAT",
  "compliance": {
    "antt_floor_price": 2200,
    "is_below_antt_floor": false,
    "rntrc_status": "ACTIVE",
    "toll_compliance": "OK"
  },
  "alerts": [],
  "blocking": false,
  "suggestions": [
    "Preço mínimo estimado para margem 8%: R$ 2663.80."
  ],
  "metadata": {
    "antt_source": "https://www.gov.br/antt/pt-br/assuntos/cargas/piso-minimo-de-frete",
    "antt_version": "antt-2026-02-17",
    "used_default_params": false
  }
}
```

## Blocking response example (regulatory violation)

```json
{
  "success": true,
  "total_cost": 2450.7,
  "breakdown": {
    "fuel": 1000,
    "variable": 600,
    "fixed_alloc": 600,
    "tolls": 120,
    "time_cost": 270,
    "fees": 89,
    "empty_return": 171.7
  },
  "profit_value": -350.7,
  "margin_percent": -16.71,
  "classification": "LOSS",
  "compliance": {
    "antt_floor_price": 2200,
    "is_below_antt_floor": true,
    "rntrc_status": "INACTIVE",
    "toll_compliance": "WARNING"
  },
  "alerts": [
    {
      "severity": "error",
      "code": "ANTT_FLOOR_VIOLATION",
      "message": "Preço informado abaixo do piso ANTT estimado (R$ 2200.00)."
    },
    {
      "severity": "error",
      "code": "RNTRC_INVALID",
      "message": "RNTRC não está ativo (status: INACTIVE)."
    }
  ],
  "blocking": true,
  "suggestions": [
    "Margem negativa detectada. Reavalie custo fixo alocado e preço final.",
    "Preço abaixo do piso ANTT. Preço mínimo regulatório estimado: R$ 2200.00."
  ]
}
```
