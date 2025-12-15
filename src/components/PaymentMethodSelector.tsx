import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  DollarSign, 
  Smartphone,
  CheckCircle
} from "lucide-react";

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isAvailable: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  totalAmount: number;
  className?: string;
}

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodChange, 
  totalAmount,
  className = ""
}: PaymentMethodSelectorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      description: 'Pay in cash when the service is completed',
      icon: <DollarSign className="h-5 w-5" />,
      isAvailable: true
    },
    {
      id: 'visa_debit_card',
      name: 'Visa/Debit Card',
      description: 'Secure online payment with your card',
      icon: <CreditCard className="h-5 w-5" />,
      isAvailable: true
    },
    {
      id: 'easypaisa',
      name: 'Easypaisa',
      description: 'Pay using Easypaisa mobile wallet',
      icon: <Smartphone className="h-5 w-5" />,
      isAvailable: true
    }
  ];

  const handleMethodChange = (methodId: string) => {
    onMethodChange(methodId);
  };

  const getMethodName = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method?.name || 'Cash on Delivery';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred payment method
        </p>
      </div>

      <RadioGroup 
        value={selectedMethod} 
        onValueChange={handleMethodChange}
        className="space-y-3"
      >
        {paymentMethods.map((method) => (
          <Card 
            key={method.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMethod === method.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'border-border'
            } ${!method.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => method.isAvailable && handleMethodChange(method.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <RadioGroupItem 
                  value={method.id} 
                  id={method.id}
                  disabled={!method.isAvailable}
                  className="sr-only"
                />
                
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    selectedMethod === method.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {method.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label 
                        htmlFor={method.id} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {method.name}
                      </Label>
                      {selectedMethod === method.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {method.description}
                    </p>
                  </div>
                </div>

                {!method.isAvailable && (
                  <Badge variant="secondary" className="text-xs">
                    Coming Soon
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      {/* Payment Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Amount:</span>
            <span className="text-lg font-bold text-primary">
              Rs. {totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Payment method: {getMethodName(selectedMethod)}
          </div>
        </CardContent>
      </Card>

      {/* Payment Processing Status */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Processing payment...</span>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector; 