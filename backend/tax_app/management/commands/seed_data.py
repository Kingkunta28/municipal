"""
Management command to seed initial data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tax_app.models import User, TaxpayerProfile, TaxType, TaxAccount, PaymentRequest


class Command(BaseCommand):
    help = 'Seed the database with initial data'
    
    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')
        
        # Create admin user
        if not User.objects.filter(email='admin@example.com').exists():
            admin_user = User.objects.create_superuser(
                email='admin@example.com',
                password='Admin123!',
                role='Administrator',
                first_name='Admin',
                last_name='User'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.email}'))
        else:
            self.stdout.write('Admin user already exists')
        
        # Create tax types with default_amount so new accounts get auto-assigned tax due
        tax_types_data = [
            {'name': 'Property Tax', 'description': 'Annual property tax for residential and commercial properties', 'default_amount': 500000.00},
            {'name': 'Business License', 'description': 'Annual business license fee', 'default_amount': 250000.00},
            {'name': 'Service Levy', 'description': 'Service levy for municipal services', 'default_amount': 150000.00},
            {'name': 'Market Fees', 'description': 'Fees for market stalls and trading', 'default_amount': 100000.00},
            {'name': 'Parking Fees', 'description': 'Parking fees for municipal parking lots', 'default_amount': 50000.00},
        ]
        
        for tax_type_data in tax_types_data:
            tax_type, created = TaxType.objects.get_or_create(
                name=tax_type_data['name'],
                defaults=tax_type_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'Created tax type: {tax_type.name} (default amount: {tax_type.default_amount:,.0f} TZS)'
                ))
            else:
                # Update default_amount on existing records so they reflect the seeded values
                TaxType.objects.filter(pk=tax_type.pk).update(default_amount=tax_type_data['default_amount'])
                self.stdout.write(f'Tax type already exists (updated default_amount): {tax_type.name}')
        
        # Create demo taxpayer
        if not User.objects.filter(email='taxpayer@example.com').exists():
            taxpayer_user = User.objects.create_user(
                email='taxpayer@example.com',
                password='Taxpayer123!',
                role='Taxpayer'
            )
            
            profile = TaxpayerProfile.objects.create(
                user=taxpayer_user,
                first_name='John',
                middle_name='Michael',
                last_name='Doe',
                gender='Male',
                date_of_birth='1985-06-15',
                mobile_phone='+255712345678',
                national_id_number='1234567890123',
                ward='Ward 10',
                street_village='Main Street',
                house_number='123',
                taxpayer_type='Business',
                property_location='Plot 45, Industrial Area',
                business_name='Doe Enterprises Ltd'
            )
            
            # Create tax account with some data
            property_tax = TaxType.objects.get(name='Property Tax')
            tax_account = TaxAccount.objects.create(
                user=taxpayer_user,
                tax_type=property_tax,
                total_tax_due=500000.00,
                paid_amount=150000.00,
                outstanding_balance=350000.00,
                next_payment_due_date=timezone.now().date() + timedelta(days=30),
                status='Active'
            )
            
            self.stdout.write(self.style.SUCCESS(f'Created demo taxpayer: {taxpayer_user.email}'))
            
            # Create some payment requests
            PaymentRequest.objects.create(
                user=taxpayer_user,
                tax_account=tax_account,
                amount=100000.00,
                payment_method='Mobile Money',
                status='Completed',
                provider_reference='REF123456',
                completed_at=timezone.now() - timedelta(days=10)
            )
            
            PaymentRequest.objects.create(
                user=taxpayer_user,
                tax_account=tax_account,
                amount=50000.00,
                payment_method='Pesapal',
                status='Pending',
                provider_reference='REF789012'
            )
            
            self.stdout.write(self.style.SUCCESS('Created payment requests for demo taxpayer'))
        
        # Create a few more demo taxpayers
        demo_taxpayers = [
            {
                'email': 'business1@example.com',
                'password': 'Business123!',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'national_id': '9876543210987',
                'business': 'Smith Trading Co',
                'tax_due': 750000.00,
                'paid': 250000.00
            },
            {
                'email': 'business2@example.com',
                'password': 'Business123!',
                'first_name': 'Robert',
                'last_name': 'Johnson',
                'national_id': '5555666677778',
                'business': 'Johnson Investments',
                'tax_due': 1200000.00,
                'paid': 0.00
            }
        ]
        
        for data in demo_taxpayers:
            if not User.objects.filter(email=data['email']).exists():
                user = User.objects.create_user(
                    email=data['email'],
                    password=data['password'],
                    role='Taxpayer'
                )
                
                TaxpayerProfile.objects.create(
                    user=user,
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    gender='Male',
                    date_of_birth='1990-01-01',
                    mobile_phone='+255711111111',
                    national_id_number=data['national_id'],
                    ward='Ward 5',
                    street_village='Market Street',
                    house_number='50',
                    taxpayer_type='Business',
                    property_location='Downtown',
                    business_name=data['business']
                )
                
                tax_type = TaxType.objects.first()
                TaxAccount.objects.create(
                    user=user,
                    tax_type=tax_type,
                    total_tax_due=data['tax_due'],
                    paid_amount=data['paid'],
                    outstanding_balance=data['tax_due'] - data['paid'],
                    status='Overdue' if data['paid'] == 0 else 'Active'
                )
                
                self.stdout.write(self.style.SUCCESS(f'Created demo taxpayer: {user.email}'))
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed!'))
