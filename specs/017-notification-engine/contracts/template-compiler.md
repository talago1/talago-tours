# Contracts: Template Compiler Interface

**Feature**: 017-notification-engine

## Template Compiler Specification

### Purpose

Transform templates with `{{placeholder}}` tokens into concrete messages by substituting values from a booking context.

### Interface Signature

```typescript
// utils/notificationCompiler.ts
export interface NotificationCompiler {
  compile(templateBody: string, context: Booking): string;
  validate(templateBody: string): ValidationResult;
}
```

### Supported Placeholders

| Token | Data Source | Example | Notes |
|-------|-------------|---------|-------|
| `{{customer_name}}` | `Booking.customerName` | "John Smith" | Always required |
| `{{tour_title}}` | `Tour.title` | "Cairo Pyramids Day Tour" | Always required |
| `{{departure_date}}` | `Booking.departureDate` | "2026-06-15" | ISO date format |
| `{{pickup_time}}` | `Booking.pickupTime` | "08:00 AM" | Always required |
| `{{pickup_location}}` | `Booking.pickupLocation` | "Hilton Hotel, Cairo" | Always required |
| `{{voucher_url}}` | `Booking.voucherUrl` | "https://talago.tours/v/abc123" | Feature 12 integration |
| `{{booking_reference}}` | `Booking.reference` | "TLG-20260615-0078" | Always required |
| `{{amount_due_on_arrival}}` | `Booking.amountDueOnArrival` | "$150.00" | Currency formatted |

### Template Grammar

- **Syntax**: `{{token_name}}`
- **Whitespace**: Preserved as-is in output
- **Validation**: All tokens must be valid (no unknown placeholders)
- **Required tokens**: All 8 tokens must be present in template body
- **Escape**: `{{` and `}}` in template must be escaped as `{{` and `}}`

### Examples

**WhatsApp template:**
```text
Hi {{customer_name}}, your tour {{tour_title}} is confirmed! 🎉

📅 Date: {{departure_date}}
⏰ Pickup: {{pickup_time}} at {{pickup_location}}

🎟️ Booking: {{booking_reference}}
💰 Due on arrival: {{amount_due_on_arrival}}

👉 View voucher: {{voucher_url}}

Reply STOP to unsubscribe.
```

**Email template:**
```text
Subject: Your TALAGO Booking Confirmation - {{booking_reference}}

Dear {{customer_name}},

We're excited to confirm your booking for:

🏛️ Tour: {{tour_title}}
📅 Departure: {{departure_date}}
⏰ Pickup Time: {{pickup_time}}
📍 Pickup Location: {{pickup_location}}

💳 Amount Due on Arrival: {{amount_due_on_arrival}}
🎟️ Booking Reference: {{booking_reference}}
🔗 View Your Voucher: {{voucher_url}}

See you soon!
The TALAGO Team
```

### Error Cases

```typescript
// Validation result type
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Example errors:
"Unknown placeholder: {{unknown_field}}"
"Missing required token: {{customer_name}}"
"Mismatched braces: {{unclosed_token"
```

### Implementation Notes

- **Performance**: Pre-compile tokens on template save; cache compiled regex patterns
- **Security**: Reject templates with HTML tags for WhatsApp
- **Testing**: Unit tests for all valid/placeholder permutations