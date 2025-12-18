# TODO: Add City and Address Fields to Student Personal Details

## Completed Tasks

- [x] Analyzed frontend StudentPersonalDetails.jsx - fields already present
- [x] Analyzed backend controller - already handles otherFields dynamically
- [x] Added 'city' and 'address' fields to StudentDetails model

## Database Changes Required

To complete the implementation, run the following SQL commands on your database:

```sql
ALTER TABLE student_details ADD COLUMN city VARCHAR(255);
ALTER TABLE student_details ADD COLUMN address TEXT;
```

Or if using Sequelize migrations, create a new migration file.

## Next Steps

- [ ] Run database migration to add the new columns
- [ ] Test the update functionality to ensure city and address are saved correctly
- [ ] Verify the fields display properly in the frontend
